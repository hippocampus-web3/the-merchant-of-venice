import { Hyperliquid } from "hyperliquid";
import dotenv from "dotenv";

dotenv.config();

const sdk = new Hyperliquid({
    enableWs: false,
    privateKey: process.env.PRIVATE_KEY,
    testnet: false,
});
  
export async function getCurrentMerchantPositions() {
    await sdk.connect(); // TODO: Fix problem with recurrent connect
    sdk.info.perpetuals.getClearinghouseState('0xdE9f2CdE3dfF96CBb12a573B7043E7C14a42BeF6').then(clearinghouseState => {
        console.log(clearinghouseState);
      }).catch(error => {
        console.error('Error getting clearinghouse state:', error);
      });
} 

export async function getMerchantPerpetualAccountSummary() {
  await sdk.connect();
  sdk.info.perpetuals.getClearinghouseState('0xdE9f2CdE3dfF96CBb12a573B7043E7C14a42BeF6').then(clearinghouseState => {
    console.log(clearinghouseState);
  }).catch(error => {
    console.error('Error getting clearinghouse state:', error);
  });
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

// export async function placeOrder(coin, sizeInUsd) {
//     await sdk.connect();
//     const marketPrice = await getAssetMarketPrice(coin)
//     const orderResponse = await sdk.exchange.placeOrder({
//         coin,
//         is_buy: true,
//         sz: 15,
//         limit_px: marketPrice, // Decrease to insta fill
//         order_type: { limit: { tif: 'Ioc' } },
//         reduce_only: false,
//       })
//     console.log(orderResponse);
//     return '' // Order Id
// }

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
  console.info('Open market position:', orderResponse.response.data.statuses[0].filled)
  return orderResponse
}

export async function closePosition(coin: string = 'RUNE-PERP') {
  await sdk.connect();
  const response = await sdk.custom.marketClose(coin)
  console.info('Close position:', response.response.data.statuses[0].filled)
  return response
}


