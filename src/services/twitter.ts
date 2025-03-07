import { MerchantPosition, TwitterSearchResponse } from "../types.js";

import { readFile } from 'fs/promises';
import { getAssetIndex } from "./hyperliquid.js";

const loadTwitterSearchResponse = async () => {
  const rawData = await readFile('./src/tests/twitter-response.json', 'utf-8');
  return JSON.parse(rawData);
};

export async function searchTweetsByHashtag(): Promise<TwitterSearchResponse> {
    const twitterFakeResponse = await loadTwitterSearchResponse() // TODO: Implement real search
    console.debug('Twitter search response', twitterFakeResponse)
    return twitterFakeResponse
}

export function parseTweetResponseToOrders(search: TwitterSearchResponse): MerchantPosition[] {
    const tweets = search.data
    const parsedOrders: MerchantPosition[] = []
    tweets.forEach(tweet => {
        try {
            const order = parseTweetContent(tweet.text)
            parsedOrders.push(order)
        } catch (e) {
            console.error('Invalid tweet', tweet.text, e)
        }
    })
    return parsedOrders
}

export function parseTweetContent(tweetContent: string): MerchantPosition {
  const regex =
    /Ticker:\s*\$(?<ticker>\w+)\s*Direction:\s*(?<direction>short|long)\s*Size:\s*(?<size>small|medium|large)\s*Time horizon:\s*(?<horizon>8h|16h|24h)\s*Tip:\s*(?<addressTip>\w+)/i;

  const cleanedContent = tweetContent.replace('#veniceTrader', '').replace(/\s+/g, ' ').trim();

  const match = cleanedContent.match(regex);

  if (!match || !match.groups) {
    throw new Error("Invalid input format");
  }

  const ticker = match.groups.ticker.replace('$', '')
  const assetIndex = getAssetIndex(ticker)
  
  if (assetIndex === undefined) {
    throw new Error(`Invalid asset not found ${ticker}`)
  }

  return {
    ticker,
    direction: match.groups.direction.toLowerCase() as "short" | "long",
    size: match.groups.size.toLowerCase() as "small" | "medium" | "large",
    horizon: match.groups.horizon as "8h" | "16h" | "24h",
    addressTip: match.groups.addressTip,
  };
}
