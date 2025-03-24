import { MerchantPosition, TwitterSearchResponse } from "../types.js";
import { readFile } from 'fs/promises';
import { getAssetIndex } from "./hyperliquid.js";
import axios from "axios";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

const loadTwitterSearchResponse = async () => {
  const rawData = await readFile('./src/tests/twitter-response.json', 'utf-8');
  return JSON.parse(rawData);
};

export async function searchTweetsByHashtag(): Promise<TwitterSearchResponse> {
  if (process.env.TWITTER_BEARER_TOKEN) {
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
      Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
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
    console.warn('TWITTER_BEARER_TOKEN not set, skipping search and working with mock data')
    const mockTweets = await loadTwitterSearchResponse()
    return mockTweets
  }
}

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

/**
 * Publishes a tweet using Twitter API v2 with OAuth 1.0a User Context
 * 
 * @param content The content of the tweet to publish
 * @returns The ID of the published tweet and its text
 */
export async function publishTweet(content: string): Promise<{ id: string, text: string }> {
  // Check if all required environment variables are set
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || 
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    throw new Error('Twitter credentials not set. Required: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET');
  }
  
  // Setup OAuth 1.0a
  const oauth = new OAuth({
    consumer: {
      key: process.env.TWITTER_API_KEY,
      secret: process.env.TWITTER_API_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
  });
  
  // Request data
  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';
  
  // Generate authorization header
  const token = {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_ACCESS_SECRET,
  };
  
  const authorization = oauth.authorize(
    { url, method },
    token
  );
  
  const headers = {
    ...oauth.toHeader(authorization),
    'Content-Type': 'application/json',
  };
  
  try {
    const response = await axios.post(
      url,
      { text: content },
      { headers }
    );
    
    console.log('Tweet published successfully:', response.data);
    
    return {
      id: response.data.data.id,
      text: response.data.data.text
    };
  } catch (error: any) {
    if (error?.response?.data) {
      console.error("Twitter API Error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error publishing tweet:", error);
    }
    throw new Error('Failed to publish tweet');
  }
}