import OpenAI from "openai";
import dotenv from "dotenv";
import { MerchantPosition, VeniceResponse } from "../types.js";

dotenv.config();

const BASE_URL = "https://api.venice.ai/api/v1"

const client = new OpenAI.OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: BASE_URL,
});

const getPromp = (orders: MerchantPosition[]) => {
    return `
        Select a number ${process.env.NUMBER_OF_ORDERS_TO_OPEN || 1} of order(s) that you consider the most profitable from the following list of trading orders:  

        ${orders.map(order => (`Ticker: ${order.ticker}\nDirection: ${order.direction}\nSize: ${order.size}\nTime horizon: ${order.horizon}`))}  

        Your response must be in the following format. Only that response in that format, nothing else. Do not provide any additional information. Make sure to always return at least one order no matter what and strictly follow the format. But always one from the given list of trading orders.  

        [
            {
                "ticker": "RUNE",
                "direction": "short",
                "size": "medium",
                "horizon": "8h"
            }
        ]  
    `
} 

export async function getSugestionsUsingVenice(orders: MerchantPosition[]): Promise<VeniceResponse> {
    try {
        const promp = getPromp(orders)
        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: promp }],
            model: 'llama-3.3-70b',
        });
        return chatCompletion as VeniceResponse
    } catch(e) {
        console.error(e)
        throw e
    }
}

export function parseVeniceResponse (response: VeniceResponse): MerchantPosition[] {
    const text = response.choices[0].message.content
    const proposedOrders: MerchantPosition[] = JSON.parse(text)
    return proposedOrders
}