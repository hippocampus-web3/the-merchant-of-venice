import dotenv from "dotenv";
import { getOrdersFromTwitterLast24hWithHastagh } from "./controllers/twitter.controller.js";
import cron from "node-cron";
import { getSuggestedPositionsBasedOnVeniceOutput } from "./controllers/venice.controller.js";
import { closePosition, marketOrder } from "./services/hyperliquid.js";
import { mapHorizonMilliseconds, mapSizeDollars } from "./constants.js";

dotenv.config();

async function merchantWork() {
  console.log(`${Date.now()} Executing merchant work...`);
  // 1) Get all tweets from last 24h
  const ordersFromTwitter = await getOrdersFromTwitterLast24hWithHastagh()

  // 2) Send to Venice API and extract 3 positions
  const suggestedPositions = await getSuggestedPositionsBasedOnVeniceOutput(ordersFromTwitter)

  // 3) Open positions in Hyperliquid
  for (const position of suggestedPositions) {
    await marketOrder(position.ticker +  '-PERP', mapSizeDollars[position.size], position.direction === 'long' ? true : false)
    // 4) Configure Timeouts to close positions depending on provided horizon
    const timeToDelay = mapHorizonMilliseconds[position.horizon]
    setTimeout(async () => {
      await closePosition(position.ticker +  '-PERP')
    }, timeToDelay); // TODO use correct parametrization for cloaseDelay
    // 5) TODO: Send tip to user in case of positive returns
  }
}

// try {
//   await merchantWork()
// } catch(e) {}


cron.schedule("0 0 * * *", async () => {
  await merchantWork()
});