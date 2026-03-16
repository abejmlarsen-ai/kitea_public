import { getContract } from 'thirdweb'
import { baseSepolia } from 'thirdweb/chains'
import { thirdwebClient } from './client'

export const kiteaNFTContract = getContract({
  client: thirdwebClient,
  chain: baseSepolia,
  address: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
})
