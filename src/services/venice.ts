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
    // TODO: Translate to english
    return `
        Seleciona un número ${process.env.NUMBER_OF_ORDERS_TO_OPEN} de orden/es que consideres más rentables de la siguiente lista de ordenes de trading: 

        ${orders.map(order => (`Ticker: ${order.ticker}\nDirection: ${order.direction}\nSize: ${order.size}\nTime horizon: ${order.horizon}\nTip: ${order.addressTip}`))}

        La respuesta que des debe ser en el formato. Solo esa respuesta en ese formato nada mas. No me des mas información. Y asegurate de devolver una orden siempre pase lo que pase y sin saltarte el formato. Pero siempre una de las que te paso en lista de ordenes de trading.

        [
            {
                "ticker": "RUNE",
                "direction": "short",
                "size": "medium",
                "time horizon": "8h",
                "tip": "thor1ld30uyy5zz023ydqfjn84gmw76h9gsfyp46607"
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