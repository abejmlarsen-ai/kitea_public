import { createThirdwebClient } from 'thirdweb'
import { baseSepolia } from 'thirdweb/chains'
import { getContract, sendTransaction } from 'thirdweb'
import { mintAdditionalSupplyTo } from 'thirdweb/extensions/erc1155'
import { privateKeyToAccount } from 'thirdweb/wallets'

export async function mintNFT({
  toAddress,
  tokenId,
  amount = 1,
}: {
  toAddress: string
  tokenId: bigint
  amount?: number
}): Promise<string> {
  // ── Guard: verify all required env vars are present ───────────────────────
  const secretKey      = process.env.THIRDWEB_SECRET_KEY
  const privateKey     = process.env.DEPLOYER_PRIVATE_KEY
  const contractAddr   = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS

  console.log('[mintNFT] called with toAddress:', toAddress, 'tokenId:', tokenId.toString(), 'amount:', amount)
  console.log('[mintNFT] env check — THIRDWEB_SECRET_KEY set:', !!secretKey)
  console.log('[mintNFT] env check — DEPLOYER_PRIVATE_KEY set:', !!privateKey)
  console.log('[mintNFT] env check — NFT_CONTRACT_ADDRESS:', contractAddr ?? '(missing!)')
  console.log('[mintNFT] chain: base-sepolia (chainId 84532)')

  if (!secretKey) {
    throw new Error('[mintNFT] THIRDWEB_SECRET_KEY is not set')
  }
  if (!privateKey) {
    throw new Error('[mintNFT] DEPLOYER_PRIVATE_KEY is not set')
  }
  if (!contractAddr) {
    throw new Error('[mintNFT] NEXT_PUBLIC_NFT_CONTRACT_ADDRESS is not set')
  }

  // ── Create client ──────────────────────────────────────────────────────────
  console.log('[mintNFT] creating Thirdweb client...')
  const client = createThirdwebClient({ secretKey })

  // ── Create signer account ─────────────────────────────────────────────────
  console.log('[mintNFT] creating deployer account from private key...')
  let account
  try {
    account = privateKeyToAccount({ client, privateKey })
    console.log('[mintNFT] deployer account address:', account.address)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[mintNFT] privateKeyToAccount failed:', msg)
    throw new Error('[mintNFT] privateKeyToAccount failed: ' + msg)
  }

  // ── Get contract ──────────────────────────────────────────────────────────
  console.log('[mintNFT] getting contract at:', contractAddr)
  const contract = getContract({
    client,
    chain: baseSepolia,
    address: contractAddr,
  })

  // ── Build transaction ─────────────────────────────────────────────────────
  console.log('[mintNFT] building mintAdditionalSupplyTo transaction...')
  let transaction
  try {
    transaction = mintAdditionalSupplyTo({
      contract,
      to: toAddress,
      tokenId,
      supply: BigInt(amount),
    })
    console.log('[mintNFT] transaction built successfully')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[mintNFT] mintAdditionalSupplyTo build failed:', msg)
    throw new Error('[mintNFT] mintAdditionalSupplyTo build failed: ' + msg)
  }

  // ── Send transaction ──────────────────────────────────────────────────────
  console.log('[mintNFT] sending transaction to chain...')
  try {
    const receipt = await sendTransaction({ transaction, account })
    console.log('[mintNFT] transaction confirmed — txHash:', receipt.transactionHash)
    return receipt.transactionHash
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[mintNFT] sendTransaction failed:', msg)
    throw new Error('[mintNFT] sendTransaction failed: ' + msg)
  }
}
