# Runbook

## How to add a new hunt / replace a tag UID

Everything below is a **Supabase data write only** — no code change, no
redeploy. The scan flow, hunt content pages, and the map all query these
tables fresh on every request (`app/map/page.tsx` and `app/hunts/[id]/page.tsx`
are both explicitly marked `export const dynamic = 'force-dynamic'`), so a new
row is live the moment it's written.

### Add a new hunt

Do this via the Admin panel (`/admin`) where possible — it writes to the same
tables listed here.

1. **`hunt_locations`** — one row. `name` is required; also set
   `description`, `latitude`, `longitude`, `region`, `city`. Leave
   `is_active = false` until content (below) is ready, then flip it to `true`
   to go live. This row's `id` is the `hunt_location_id` every table below
   hangs off.
2. **`hunt_clues`** — one row, `hunt_location_id` = the id from step 1.
   `image_url`, `text_content`, `code_type_hint` are editable from Admin's
   Hunts tab. **`answer`** (the value checked in `/api/hunt/answer`) is not
   yet exposed in the Admin UI — set it directly in Supabase for now.
3. **`hunt_hints`** — one row, `hunt_location_id` = the id from step 1.
   `hint_1_text`/`hint_1_answer` required; `hint_2_*`/`hint_3_*` optional.
4. **`hunt_reveals`** — one row, `hunt_location_id` = the id from step 1.
   `reveal_directions` is **required (NOT NULL)** — Admin's Save Reveal button
   now blocks an empty submission rather than letting it fail in the database.
   `reveal_image_url` is optional.
5. **`nfc_tags`** — one row per physical tag: `tag_uid`, `hunt_location_id` =
   the id from step 1, `is_active = true`.

### Replace a tag UID / retire a tag

Update the existing `nfc_tags` row directly (Admin → NFC Tags, or in
Supabase):
- **Swap the physical tag**: change `tag_uid` on the row to the new tag's UID.
- **Retire a tag** without losing scan history: set `is_active = false`
  instead of deleting the row. Rows already written to `scans` store
  `tag_uid` as a point-in-time value, not a live foreign key, so past scans
  are unaffected by later UID or `is_active` changes.

`/api/nfc/scan` matches the incoming UID against 4 normalized variants of
`nfc_tags.tag_uid` (raw, uppercase, colon-stripped, uppercase+colon-stripped),
so store whatever format the physical reader reports — you don't need to
massage casing or colons to match.

### Verify a change before it reaches players

```
npm run test:scan
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (see
`.env.local.example`) and the dev server running (`npm run dev`). It inserts
a throwaway `hunt_locations` + `nfc_tags` row, scans it through the real
`/api/nfc/scan` endpoint, asserts it resolves, and deletes everything it
created — safe to run any time, including right after adding a real tag.

### When a code change actually IS required

- Adding a column beyond what's listed above, or a new table.
- Anything that changes `lib/types/database.ts` out of sync with the live
  schema — regenerate it after any schema change (Supabase MCP
  `generate_typescript_types`, or `supabase gen types typescript`) so a
  column-name mismatch is a `tsc` compile error, not a "Tag not recognised"
  page in production.
