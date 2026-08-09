// ─── Deprecated — superseded by /api/collectible/mint ───────────────────────
// Kept only because the sandboxed shell in this environment could not run
// `rm` to delete this file/folder. Please delete app/api/nft/ manually —
// nothing in the codebase calls this route anymore.
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Moved to /api/collectible/mint.' }, { status: 410 })
}
