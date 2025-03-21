import { MerchantPosition, TwitterSearchResponse } from "../types.js";

import { readFile } from 'fs/promises';
import { getAssetIndex } from "./hyperliquid.js";
import axios from "axios";

const loadTwitterSearchResponse = async () => {
  const rawData = await readFile('./src/tests/twitter-response.json', 'utf-8');
  return JSON.parse(rawData);
};

export async function searchTweetsByHashtag(): Promise<TwitterSearchResponse> {

  if (process.env.TWITTER_API_KEY) {
    const nowUtc = new Date();
    const startDate = new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000);
  
    const startDateStr = startDate.toISOString();
    const endDateStr = new Date(nowUtc.getTime() - 45000); // Twitter API need a delay for end date
  
    const url = "https://api.twitter.com/2/tweets/search/recent";
    
    const params = {
      start_time: startDateStr,
      end_time: endDateStr,
      max_results: 10,
      query: '#veniceTrader',
    };
  
    const headers = {
      Authorization: `Bearer ${process.env.TWITTER_API_KEY}`,
      "Content-Type": "application/json",
    };
  
    let response = null
  
    try {
      response = await axios.get(url, { params, headers });
    } catch (error: any) {
      if (error?.response && error?.response.data && error?.response.data.detail) {
        console.error("Twitter API Error:", error?.response.data.detail);
      }
      if (error?.response && error?.response.data && error?.response.data.errors) {
        console.error("Twitter API Error:", JSON.stringify(error?.response.data.errors, null, 2));
      }
      throw new Error('Error fetching tweets')
    }
  
    const tweetResponse: TwitterSearchResponse = response.data;
  
    console.log('response', response.data)
  
    if (tweetResponse.meta.result_count <= 0) {
      throw new Error('No tweets found in last 24h')
    }
  
    return tweetResponse;
  } else {
    console.warn('TWITTER_API_KEY not set, skipping search and working with mock data')
    const mockTweets = await loadTwitterSearchResponse()
    return mockTweets
  }
}

//   const twitterFakeResponse = await loadTwitterSearchResponse() // TODO: Implement real search
//   console.debug('Twitter search response', twitterFakeResponse)
//   return twitterFakeResponse
// }

export async function parseTweetResponseToOrders(search: TwitterSearchResponse): Promise<MerchantPosition[]> {
    const tweets = search.data
    const parsedOrders: MerchantPosition[] = []
    const promises = tweets.map(async tweet => {
        try {
            const order = await parseTweetContent(tweet.text)
            parsedOrders.push(order)
        } catch (e) {
            console.error('Invalid tweet', tweet.text, e)
        }
    })
    await Promise.all(promises)
    return parsedOrders
}

export async function parseTweetContent(tweetContent: string): Promise<MerchantPosition> {
  const regex =
    /Ticker:\s*\$(?<ticker>\w+)\s*Direction:\s*(?<direction>short|long)\s*Size:\s*(?<size>small|medium|large)\s*Time horizon:\s*(?<horizon>8h|16h|20h)(?:\s*Tip:\s*(?<tip>thor\w+))?/i

  const cleanedContent = tweetContent.replace('#veniceTrader', '').replace(/\s+/g, ' ').trim();

  const match = cleanedContent.match(regex);

  if (!match || !match.groups) {
    throw new Error("Invalid input format");
  }

  const ticker = match.groups.ticker.replace('$', '')
  const assetIndex = await getAssetIndex(`${ticker}-PERP`)
  
  if (assetIndex === undefined) {
    throw new Error(`Invalid asset not found ${ticker}`)
  }

  return {
    ticker,
    direction: match.groups.direction.toLowerCase() as "short" | "long",
    size: match.groups.size.toLowerCase() as "small" | "medium" | "large",
    horizon: match.groups.horizon as "8h" | "16h" | "20h",
    tip: match.groups.tip,
  };
}
