import { parseTweetResponseToOrders } from "../src/services/twitter";

import { readFile } from "fs/promises";

const loadTwitterSearchResponse = async () => {
  const rawData = await readFile("./src/tests/twitter-response.json", "utf-8");
  return JSON.parse(rawData);
};

test("Twitter response parse", async () => {
  const twitterSearchResponse = await loadTwitterSearchResponse();
  const selectedPositions = await parseTweetResponseToOrders(twitterSearchResponse);
  expect(selectedPositions).toEqual([
      {
        direction: "short",
        horizon: "8h",
        size: "medium",
        ticker: "RUNE",
      },
      {
        direction: "long",
        horizon: "16h",
        size: "small",
        ticker: "BTC",
      },
  ]);
});
