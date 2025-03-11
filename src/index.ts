import dotenv from "dotenv";
import { getOrdersFromTwitterLast24hWithHastagh } from "./controllers/twitter.controller.js";
import cron from "node-cron";
import { getSuggestedPositionsBasedOnVeniceOutput } from "./controllers/venice.controller.js";
import { closePosition, getVaultUsdValue, marketOrder } from "./services/hyperliquid.js";
import { mapHorizonMilliseconds, mapSizePercentage } from "./constants.js";

dotenv.config();

async function merchantWork() {

  if (!process.env.VAULT_ADDRESS) {
    throw Error ('VAULT_ADDRESS is not defined')
  }

  console.log(`${Date.now()} Executing merchant work...`);
  // 1) Get all tweets from last 24h
  const ordersFromTwitter = await getOrdersFromTwitterLast24hWithHastagh()

  // 2) Send to Venice API and extract 3 positions
  const suggestedPositions = await getSuggestedPositionsBasedOnVeniceOutput(ordersFromTwitter)

  // 3) Open positions in Hyperliquid
  for (const position of suggestedPositions) {
    const sizePercentage = mapSizePercentage[position.size]
    const result = await getVaultUsdValue(process.env.VAULT_ADDRESS as string)
    const amountInDollars = Math.trunc(Number(result) * sizePercentage) // TODO: Minimun size for position 10
    await marketOrder(position.ticker +  '-PERP', amountInDollars > 11 ? amountInDollars : 12, position.direction === 'long' ? true : false)
    // 4) Configure Timeouts to close positions depending on provided horizon
    const timeToDelay = mapHorizonMilliseconds[position.horizon]
    setTimeout(async () => {
      await closePosition(position.ticker +  '-PERP')
    }, timeToDelay); // TODO use correct parametrization for cloaseDelay
  }
}

try {
  await merchantWork()
} catch(e) {
  console.error(e)
}

cron.schedule("0 0 * * *", async () => {
  await merchantWork()
});