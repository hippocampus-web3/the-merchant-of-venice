import { MerchantPosition } from '../types.js';
import { parseTweetResponseToOrders, publishTweet, searchTweetsByHashtag } from '../services/twitter.js';


export async function getOrdersFromTwitterLast24hWithHastagh(): Promise<MerchantPosition[]> {
    const twitterFakeResponse = await searchTweetsByHashtag()
    return parseTweetResponseToOrders(twitterFakeResponse)
}

/**
 * Function to create and publish an attractive tweet about a trading position
 * Uses emojis and formatting to make the tweet more engaging
 * 
 * @param position The trading position to publish
 * @returns The ID of the published tweet and its text
 */
export async function publishTradePosition(position: MerchantPosition): Promise<{ id: string, text: string }> {
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
      hour12: true 
    });
    
    // Build an attractive tweet content
    let tweetContent = `🔔 NEW OPEN POSITION! 🔔\n\n`;
    tweetContent += `${directionEmoji} Going ${direction.toUpperCase()} on $${ticker} ${directionEmoji}\n\n`;
    tweetContent += `${sizeEmoji} Position Size: ${size.charAt(0).toUpperCase() + size.slice(1)}\n`;
    tweetContent += `${timeEmoji} Time Horizon: ${horizon}\n`;
    
    // Add tip if it exists
    if (tip) {
      tweetContent += `💡 Pro Tip: ${tip}\n`;
    }
    
    // Add timestamp and hash tags
    tweetContent += `\n⏰ Signal time: ${timeString}\n\n`;
    tweetContent += `#crypto #defai $${ticker} #${direction} ${direction === "long" ? "#bullish" : "#bearish"}`;
    
    // Publish the tweet
    return await publishTweet(tweetContent);
  }