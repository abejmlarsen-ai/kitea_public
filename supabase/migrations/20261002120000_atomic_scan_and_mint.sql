-- ─── Atomic, race-safe scan recording and collectible minting ────────────────
-- Called (service role only) from POST /api/nfc/scan via
--   app/api/nfc/scan/route.ts   → record_scan
--   lib/collectibles/mint.ts    → mint_hunt_collectible
--
-- Both functions take a row lock on the hunt_locations row first. That lock is
-- held until the calling transaction commits, so for any one hunt location:
--   • two scans can never receive the same scan_number, and
--   • two collectibles can never receive the same edition_number.
-- The numbers are assigned inside the INSERT/UPDATE statement itself — there
-- is no read-increment-write in application code.
--
-- Relies on these existing unique indexes (NOT created here):
--   scans_user_hunt_uniq                 ON scans(user_id, hunt_location_id)
--   collectibles_user_hunt_minted_uniq   ON collectibles(user_id, hunt_location_id)
--                                        WHERE status = 'minted' AND hunt_location_id IS NOT NULL
-- They remain the final guarantee; ON CONFLICT clauses below target them.


-- ── record_scan ─────────────────────────────────────────────────────────────
-- Returns the user's scan for this hunt location, creating it if needed.
--   created = true   → a new scan row was inserted (scan_number newly assigned)
--   created = false  → the user had already scanned this location
create or replace function public.record_scan(
  p_user_id          scans.user_id%type,
  p_hunt_location_id scans.hunt_location_id%type,
  p_nfc_tag_id       scans.nfc_tag_id%type,
  p_tag_uid          scans.tag_uid%type
)
returns table (
  scan_id     scans.id%type,
  scan_number scans.scan_number%type,
  created     boolean
)
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_id     scans.id%type;
  v_number scans.scan_number%type;
begin
  -- Serialise all scans for this hunt location.
  perform 1 from hunt_locations hl where hl.id = p_hunt_location_id for update;
  if not found then
    raise exception 'hunt location % not found', p_hunt_location_id
      using errcode = 'P0002';
  end if;

  -- Already scanned → return the existing row (tolerates legacy duplicates).
  select s.id, s.scan_number
    into v_id, v_number
    from scans s
   where s.user_id = p_user_id
     and s.hunt_location_id = p_hunt_location_id
   order by s.scanned_at nulls last, s.id
   limit 1;

  if found then
    -- Backfill the tag link on scans recorded before nfc_tag_id was set.
    update scans s
       set nfc_tag_id = p_nfc_tag_id
     where s.id = v_id
       and s.nfc_tag_id is null;

    return query select v_id, v_number, false;
    return;
  end if;

  -- New scan. scan_number is assigned in this statement: one past the higher
  -- of the location's counter and the highest number actually issued (so a
  -- counter that drifted out of sync can't produce a duplicate).
  insert into scans as s
         (user_id, hunt_location_id, nfc_tag_id, tag_uid, scan_number, scanned_at)
  select p_user_id,
         p_hunt_location_id,
         p_nfc_tag_id,
         p_tag_uid,
         greatest(
           coalesce(hl.total_scans, 0),
           coalesce((select max(s2.scan_number) from scans s2
                      where s2.hunt_location_id = p_hunt_location_id), 0)
         ) + 1,
         now()
    from hunt_locations hl
   where hl.id = p_hunt_location_id
  on conflict (user_id, hunt_location_id) do nothing
  returning s.id, s.scan_number into v_id, v_number;

  if v_id is null then
    -- Unreachable while every writer goes through this function (the row lock
    -- above serialises them), but if a row appeared some other way, return it.
    select s.id, s.scan_number
      into v_id, v_number
      from scans s
     where s.user_id = p_user_id
       and s.hunt_location_id = p_hunt_location_id
     order by s.scanned_at nulls last, s.id
     limit 1;

    return query select v_id, v_number, false;
    return;
  end if;

  -- Keep the location's counter in step (still under the row lock).
  update hunt_locations hl
     set total_scans = v_number
   where hl.id = p_hunt_location_id
     and coalesce(hl.total_scans, 0) < v_number;

  return query select v_id, v_number, true;
end;
$$;


-- ── mint_hunt_collectible ───────────────────────────────────────────────────
-- Returns the user's minted collectible for this hunt location, minting it if
-- needed. A non-minted row (failed, pending, or null status) for the same user
-- and location is updated and reused rather than inserting a second row.
--   minted_now = true   → minted by this call (new row, or reused row)
--   minted_now = false  → the user already had a minted collectible
create or replace function public.mint_hunt_collectible(
  p_user_id          collectibles.user_id%type,
  p_hunt_location_id collectibles.hunt_location_id%type,
  p_scan_id          collectibles.scan_id%type
)
returns table (
  collectible_id collectibles.id%type,
  edition_number collectibles.edition_number%type,
  minted_now     boolean
)
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_id      collectibles.id%type;
  v_edition collectibles.edition_number%type;
begin
  if p_hunt_location_id is null then
    -- Founder collectibles (hunt_location_id IS NULL) are awarded elsewhere.
    raise exception 'mint_hunt_collectible requires a hunt location'
      using errcode = '22004';
  end if;

  -- Serialise all mints for this hunt location.
  perform 1 from hunt_locations hl where hl.id = p_hunt_location_id for update;
  if not found then
    raise exception 'hunt location % not found', p_hunt_location_id
      using errcode = 'P0002';
  end if;

  -- Already minted → return it, linking it to the scan if it isn't yet.
  select c.id, c.edition_number
    into v_id, v_edition
    from collectibles c
   where c.user_id = p_user_id
     and c.hunt_location_id = p_hunt_location_id
     and c.status = 'minted'
   order by c.minted_at nulls last, c.id
   limit 1;

  if found then
    update collectibles c
       set scan_id = p_scan_id
     where c.id = v_id
       and c.scan_id is null
       and p_scan_id is not null;

    return query select v_id, v_edition, false;
    return;
  end if;

  -- Reuse a failed/pending row if there is one. edition_number is assigned in
  -- this statement.
  update collectibles c
     set status         = 'minted',
         edition_number = (select coalesce(max(c2.edition_number), 0) + 1
                             from collectibles c2
                            where c2.hunt_location_id = p_hunt_location_id
                              and c2.status = 'minted'),
         minted_at      = now(),
         scan_id        = coalesce(p_scan_id, c.scan_id)
   where c.id = (select c3.id
                   from collectibles c3
                  where c3.user_id = p_user_id
                    and c3.hunt_location_id = p_hunt_location_id
                    and c3.status is distinct from 'minted'
                  order by c3.id
                  limit 1)
  returning c.id, c.edition_number into v_id, v_edition;

  if v_id is not null then
    return query select v_id, v_edition, true;
    return;
  end if;

  -- Otherwise insert. edition_number is assigned in this statement. (An
  -- aggregate with no GROUP BY always yields exactly one row, so this inserts
  -- one row even when the location has no minted collectibles yet.)
  insert into collectibles as c
         (user_id, hunt_location_id, scan_id, status, edition_number, minted_at,
          chain, token_id, contract_address, transaction_hash)
  select p_user_id,
         p_hunt_location_id,
         p_scan_id,
         'minted',
         coalesce(max(c2.edition_number), 0) + 1,
         now(),
         null, null, null, null
    from collectibles c2
   where c2.hunt_location_id = p_hunt_location_id
     and c2.status = 'minted'
  on conflict (user_id, hunt_location_id)
     where status = 'minted' and hunt_location_id is not null
     do nothing
  returning c.id, c.edition_number into v_id, v_edition;

  if v_id is null then
    -- Unreachable while every writer goes through this function; return the
    -- row that won if one appeared some other way.
    select c.id, c.edition_number
      into v_id, v_edition
      from collectibles c
     where c.user_id = p_user_id
       and c.hunt_location_id = p_hunt_location_id
       and c.status = 'minted'
     order by c.minted_at nulls last, c.id
     limit 1;

    return query select v_id, v_edition, false;
    return;
  end if;

  return query select v_id, v_edition, true;
end;
$$;


-- ── Permissions ─────────────────────────────────────────────────────────────
-- These take user_id as a parameter, so they must never be callable from the
-- browser (anon / authenticated keys via PostgREST /rpc). Only the server's
-- service-role client may execute them.
revoke all on function public.record_scan            from public, anon, authenticated;
revoke all on function public.mint_hunt_collectible  from public, anon, authenticated;
grant execute on function public.record_scan           to service_role;
grant execute on function public.mint_hunt_collectible to service_role;
