import { Hyperliquid } from "hyperliquid";
import dotenv from "dotenv";

dotenv.config();

const sdk = new Hyperliquid({
    enableWs: false,
    privateKey: process.env.PRIVATE_KEY,
    testnet: false,
    walletAddress: process.env.VAULT_ADDRESS ? process.env.VAULT_ADDRESS : process.env.LEADER_ADDRESS,
    vaultAddress: process.env.VAULT_ADDRESS ? process.env.VAULT_ADDRESS : undefined,
});
  
async function getCurrentMerchantPositions(address: string) {
  await sdk.connect(); // TODO: Fix problem with recurrent connect
  return  sdk.info.perpetuals.getClearinghouseState(address)
} 

export async function getVaultUsdValue (address: string) {
  const result = await getCurrentMerchantPositions(address)
  return result.crossMarginSummary.accountValue
}

export async function getAssetIndex(asset: string) {
  await sdk.connect();
  const index = await sdk.info.getAssetIndex(asset.toUpperCase())
  return index
}

export async function getAssetMarketPrice(asset: string) {
  await sdk.connect();
  const index = await getAssetIndex(asset)
  if (index === undefined) {
    throw new Error(`Asset not found ${asset}`)
  }
  const perpsData = await sdk.info.perpetuals.getMetaAndAssetCtxs()
  const currentPrice = perpsData[1][index as number].markPx
  const perpDecimals = perpsData[0].universe[index as number].szDecimals
  return { price: Number(currentPrice), perpDecimals }
}

async function getCoinSize(coin: string, sizeInUsd: number) {
  const { price, perpDecimals } = await getAssetMarketPrice(coin)
  const assetAmount = sizeInUsd / price
  const assetAmounWithDecimals = assetAmount.toFixed(perpDecimals)
  return Number(assetAmounWithDecimals)
}

export async function marketOrder (coin: string, sizeInUsd: number, isBuy: boolean = true, horizon: string) {
  await sdk.connect();
  const coinSize = await getCoinSize(coin, sizeInUsd)
  const orderResponse = await sdk.custom.marketOpen(
    coin,
    isBuy,
    coinSize,
  )
  if ((orderResponse.response.data.statuses[0] as any)?.error) {
    console.error('Order error: ', (orderResponse.response.data.statuses[0] as any)?.error)
  }
  console.info('Open market position:', orderResponse.response.data.statuses[0].filled, horizon)
  return orderResponse
}

export async function closePosition(coin: string): Promise<number | undefined> {
  await sdk.connect();
  const response = await sdk.custom.marketClose(coin)
  console.info('Close position:', response.response.data.statuses[0].filled)
  return response.response.data.statuses[0].filled?.oid
}

export async function getPositionFillByOid(oid: number) {
  await sdk.connect();
  const userAddress = process.env.VAULT_ADDRESS as string || process.env.LEADER_ADDRESS as string
  const response = await sdk.info.getUserFills(userAddress)
  const historyPositions = response.filter(position => position.oid === oid)
  const accumPosition = historyPositions.reduce((acc, position) => {
    const accSize = acc?.sz ? Number(acc?.sz) : 0
    const closedPnl = acc?.closedPnl ? Number(acc?.closedPnl) : 0
    return {
      ...acc,
      ...position,
      sz: String(accSize + Number(position.sz)),
      closedPnl: String(closedPnl + Number(position.closedPnl)),
    }
  }, {} as any)
  console.debug('[getPositionFillByOid] Accumulated position info:', accumPosition)
  return accumPosition
}


