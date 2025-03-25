import { Client } from "@xchainjs/xchain-thorchain";
import { getAssetMarketPrice } from "./hyperliquid.js";
import { assetAmount, assetToBase } from "@xchainjs/xchain-util";

export async function sendTipInRune(
  tipAmountInDollars: number,
  address: string
): Promise<string> {
  const runePriceInDollars = (await getAssetMarketPrice("RUNE-PERP")).price;
  const amountInRune = (tipAmountInDollars / runePriceInDollars).toFixed(2);

  if (!process.env.RUNE_VAULT_MAINNET_PHRASE) {
    console.error("RUNE_VAULT_MAINNET_PHRASE is not set");
    return '-'
  }

  const thorchainClient = new Client({
    phrase: process.env.RUNE_VAULT_MAINNET_PHRASE,
  })

  console.debug(`Sending tip to ${address} with amount in RUNE ${amountInRune}`);

  const hash = await thorchainClient.transfer({
    recipient: address,
    amount: assetToBase(assetAmount(Number(amountInRune), 8)),
    memo: 'Powered by @TheVenetianBot',
  })

  return hash;
}


