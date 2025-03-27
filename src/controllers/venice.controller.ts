import { getSugestionsUsingVenice, parseVeniceResponse } from "../services/venice.js";
import { MerchantPosition } from "../types.js";

export async function getSuggestedPositionsBasedOnVeniceOutput(orders: MerchantPosition[]): Promise<MerchantPosition[]> {
    const getVeniceResponse = await getSugestionsUsingVenice(orders)
    const proposedOrders = parseVeniceResponse(getVeniceResponse)
    return proposedOrders
}