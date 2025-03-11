import { Hyperliquid } from "hyperliquid";
import dotenv from "dotenv";

dotenv.config();

const sdk = new Hyperliquid({
    enableWs: false,
    privateKey: process.env.PRIVATE_KEY,
    testnet: false,
    vaultAddress: process.env.VAULT_ADDRESS,
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
  const index = await sdk.info.getAssetIndex(asset)
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

export async function marketOrder (coin: string, sizeInUsd: number, isBuy: boolean = true) {
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
  console.info('Open market position:', orderResponse.response.data.statuses[0].filled)
  return orderResponse
}

export async function closePosition(coin: string = 'RUNE-PERP') {
  await sdk.connect();
  const response = await sdk.custom.marketClose(coin)
  console.info('Close position:', response.response.data.statuses[0].filled)
  return response
}


