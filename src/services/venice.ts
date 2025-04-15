import OpenAI from "openai";
import dotenv from "dotenv";
import { MerchantPosition, VeniceResponse } from "../types.js";
import { readFile } from 'fs/promises';

dotenv.config();

const BASE_URL = "https://api.venice.ai/api/v1"

const loadVeniceResponse = async () => {
  const rawData = await readFile('./src/tests/venice-response.json', 'utf-8');
  return JSON.parse(rawData);
};

const client = new OpenAI.OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: BASE_URL,
});

const getPromp = (orders: MerchantPosition[]) => {
    return `
        Select a number ${process.env.NUMBER_OF_ORDERS_TO_OPEN || 1} of order(s) that you consider the most profitable from the following list of trading orders:  

        ${orders.map(order => (`Ticker: ${order.ticker}\nDirection: ${order.direction}\nSize: ${order.size}\nTime horizon: ${order.horizon}\nTip: ${order?.tip}`))}  

        Your response must be in the following format. Only that response in that format, nothing else. Do not provide any additional information. Make sure to always return at least one order no matter what and strictly follow the format. But always one from the given list of trading orders. Tip is an optional field. If there is no value for it, ignore it. Do not choose two positions for the same asset. Remember add tip parameter  

        [
            {
                "ticker": "RUNE",
                "direction": "short",
                "size": "medium",
                "horizon": "8h",
                "tip: "thor1jqsdv03pp867t98d0kwe0pzl5ks6q0f9fvf3ha"
            }
        ]  
    `
} 

export async function getSugestionsUsingVenice(orders: MerchantPosition[]): Promise<VeniceResponse> {
    if (process.env.VENICE_API_KEY) {
        try {
            const promp = getPromp(orders)
            console.debug('promp', promp)
            const chatCompletion = await client.chat.completions.create({
                messages: [{ role: 'user', content: promp }],
                model: 'llama-3.3-70b',
            });
            console.debug('Venice response', chatCompletion?.choices[0]?.message)
            return chatCompletion as VeniceResponse
        } catch(e) {
            console.error(e)
            throw e
        }
    } else {
        console.warn('VENICE_API_KEY not set, skipping search and working with mock data')
        const veniceResponse = await loadVeniceResponse()
        return veniceResponse
    }
}

export function parseVeniceResponse (response: VeniceResponse): MerchantPosition[] {
    const text = response.choices[0].message.content
    const proposedOrders: MerchantPosition[] = JSON.parse(text)
    console.debug('proposedOrders', proposedOrders)
    return proposedOrders
}