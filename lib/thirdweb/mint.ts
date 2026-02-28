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
}) {
  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY!,
  })

  const account = privateKeyToAccount({
    client,
    privateKey: process.env.DEPLOYER_PRIVATE_KEY!,
  })

  const contract = getContract({
    client,
    chain: baseSepolia,
    address: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
  })

  const transaction = mintAdditionalSupplyTo({
    contract,
    to: toAddress,
    tokenId,
    supply: BigInt(amount),
  })

  const receipt = await sendTransaction({ transaction, account })
  return receipt.transactionHash
}
