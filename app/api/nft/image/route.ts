// ─── NFT Image Signed-URL Route ───────────────────────────────────────────────
// GET /api/nft/image?path=hunt-1/nft.png
// Returns { signedUrl: string } for a file in the hunt-assets-private bucket.
//
// Only accessible to authenticated users — auth is validated via cookie session
// before generating the URL so unauthenticated callers cannot enumerate files.
//
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth check ─────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // ── 2. Validate path param ─────────────────────────────────────────────────
    const path = new URL(req.url).searchParams.get('path')?.trim()
    if (!path) {
      return NextResponse.json(
        { error: 'path query parameter is required.' },
        { status: 400 }
      )
    }

    // ── 3. Generate signed URL (1 hour) ────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceRoleClient() as any
    const { data, error } = await db.storage
      .from('hunt-assets-private')
      .createSignedUrl(path, 3600)

    if (error || !data?.signedUrl) {
      console.error('[nft/image] signed URL error:', error?.message ?? 'no signedUrl returned')
      return NextResponse.json(
        { error: 'Failed to generate signed URL.' },
        { status: 500 }
      )
    }

    console.log('[nft/image] signed URL generated for path:', path)
    return NextResponse.json({ signedUrl: data.signedUrl as string })

  } catch (err) {
    console.error('[nft/image] unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}
