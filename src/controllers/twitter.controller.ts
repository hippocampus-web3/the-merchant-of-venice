import { MerchantPosition } from '../types.js';
import { parseTweetResponseToOrders, searchTweetsByHashtag } from '../services/twitter.js';


export async function getOrdersFromTwitterLast24hWithHastagh(): Promise<MerchantPosition[]> {
    const twitterFakeResponse = await searchTweetsByHashtag()
    return parseTweetResponseToOrders(twitterFakeResponse)
}