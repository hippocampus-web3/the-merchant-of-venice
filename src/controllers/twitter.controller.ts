import { MerchantPosition } from '../types.js';
import { parseTweetResponseToOrders, publishTweet, searchTweetsByHashtag } from '../services/twitter.js';
import { twitterHandles } from '../constants/twitter-handles.js';


export async function getOrdersFromTwitterLast24hWithHastagh(): Promise<MerchantPosition[]> {
    const twitterFakeResponse = await searchTweetsByHashtag()
    return parseTweetResponseToOrders(twitterFakeResponse)
}

/**
 * Function to create and publish an attractive tweet about a trading position
 * Uses emojis and formatting to make the tweet more engaging
 * 
 * @param position The trading position to publish
 * @param sizeInDollars The size of the position in dollars
 * @returns The ID of the published tweet and its text
 */
export async function publishTradePosition(position: MerchantPosition, sizeInDollars: number): Promise<{ id: string, text: string }> {
    // Validate that the position is correct
    const { ticker, direction, size, horizon, tip } = position;
    
    if (!ticker || !direction || !size || !horizon) {
      throw new Error('Invalid position data. Required: ticker, direction, size, and horizon');
    }
    
    // Direction emoji
    const directionEmoji = direction === "long" ? "🚀" : "🔻";
    
    // Size emoji
    let sizeEmoji = "📊";
    if (size === "small") sizeEmoji = "🔹";
    if (size === "medium") sizeEmoji = "🔸";
    if (size === "large") sizeEmoji = "💎";
    
    // Time horizon emoji
    let timeEmoji = "⏱️";
    if (horizon === "8h") timeEmoji = "🕗";
    if (horizon === "16h") timeEmoji = "🕔";
    if (horizon === "20h") timeEmoji = "🕗";
    
    // Current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    // Get Twitter handle for the ticker if it exists
    const twitterHandle = twitterHandles[ticker] || '';
    
    // Build an attractive tweet content
    let tweetContent = `🔔 NEW OPEN POSITION! 🔔\n\n`;
    tweetContent += `${directionEmoji} Going ${direction.toUpperCase()} on $${ticker} ${twitterHandle} ${directionEmoji}\n\n`;
    tweetContent += `${sizeEmoji} Position Size: $${sizeInDollars.toLocaleString()}\n`;
    tweetContent += `${timeEmoji} Time Horizon: ${horizon}\n`;
    
    // Add tip if it exists
    if (tip) {
      tweetContent += `💡 Tip: ${tip}\n`;
    }
    
    // Add timestamp and hash tags
    // tweetContent += `\n⏰ Signal time: ${timeString}\n\n`;
    
    // Publish the tweet
    return await publishTweet(tweetContent);
}

/**
 * Function to create and publish a tweet about a closed trading position
 * Includes PNL information and tip details if applicable
 * 
 * @param position The trading position that was closed
 * @param pnl The profit/loss of the position
 * @param tipAmount The amount tipped (if any)
 * @returns The ID of the published tweet and its text
 */
export async function publishClosedPosition(position: MerchantPosition, pnl: number, tipAmount?: number): Promise<{ id: string, text: string }> {
    const { ticker, direction, size, horizon } = position;
    
    if (!ticker || !direction || !size || !horizon) {
      throw new Error('Invalid position data. Required: ticker, direction, size, and horizon');
    }
    
    // Direction emoji
    const directionEmoji = direction === "long" ? "🚀" : "🔻";
    
    // PNL emoji
    const pnlEmoji = pnl >= 0 ? "💰" : "📉";
    
    // Size emoji
    let sizeEmoji = "📊";
    if (size === "small") sizeEmoji = "🔹";
    if (size === "medium") sizeEmoji = "🔸";
    if (size === "large") sizeEmoji = "💎";
    
    // Current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    // Build an attractive tweet content
    let tweetContent = `🔔 POSITION CLOSED! 🔔\n\n`;
    tweetContent += `${directionEmoji} Closed ${direction.toUpperCase()} on $${ticker} ${directionEmoji}\n\n`;
    tweetContent += `${pnlEmoji} PNL: $${pnl.toFixed(2)}\n`;
    
    // Add tip information if applicable
    if (tipAmount && tipAmount > 0) {
      tweetContent += `💝 Tip sent: $${tipAmount.toFixed(2)}\n`;
    }
    
    // Add timestamp
    // tweetContent += `\n⏰ Closed at: ${timeString}\n\n`;
    
    // Publish the tweet
    return await publishTweet(tweetContent);
}