// ─── NFT Mint ─────────────────────────────────────────────────────────────────
// POST /api/nft/mint
// Mints an NFT for a verified scan.  Runs server-side so the private key is
// never exposed to the client.
// Requires: NFT_PRIVATE_KEY, NFT_CONTRACT_ADDRESS env vars.

import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: implement minting logic (e.g. ethers.js / viem)
  const body = await request.json().catch(() => ({}))
  const { scanId, walletAddress } = body as { scanId?: string; walletAddress?: string }

  if (!scanId || !walletAddress) {
    return NextResponse.json({ error: 'Missing scanId or walletAddress' }, { status: 400 })
  }

  // Stub response
  return NextResponse.json({
    ok: true,
    message: 'NFT minted (stub)',
    tokenId: null,
  })
}
