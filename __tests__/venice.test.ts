import { parseVeniceResponse } from '../src/services/venice';

import { readFile } from 'fs/promises';

const loadVeniceResponse = async () => {
  const rawData = await readFile('./src/tests/venice-response.json', 'utf-8');
  return JSON.parse(rawData);
};

test('Venice response parse', async () => {
  // const veniceResponse = await import('../src/tests/venice-response.json', { assert: { type: 'json' } });
  const veniceResponse = await loadVeniceResponse();
  const selectedPositions = parseVeniceResponse(veniceResponse);
  expect(selectedPositions).toEqual([
    {
      "Ticker": "$ATOM",
      "Dirección": "long",
      "Tamaño": "large",
      "Horizonte de tiempo": "20h",
    },
    {
      "Ticker": "$SHIB",
      "Dirección": "long",
      "Tamaño": "large",
      "Horizonte de tiempo": "20h",
    },
    {
      "Ticker": "$NEAR",
      "Dirección": "long",
      "Tamaño": "large",
      "Horizonte de tiempo": "20h",
    }
  ]);
});

