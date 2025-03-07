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
      "Horizonte de tiempo": "24h",
      "Tip": "atom1dzpxcslkjm9yp5m6hh6wpt3x2f8xvzq4yk7q6c"
    },
    {
      "Ticker": "$SHIB",
      "Dirección": "long",
      "Tamaño": "large",
      "Horizonte de tiempo": "24h",
      "Tip": "shib1ksv2p7yq4djg58hrwl9x6ypztn9mch8fy83d5q"
    },
    {
      "Ticker": "$NEAR",
      "Dirección": "long",
      "Tamaño": "large",
      "Horizonte de tiempo": "24h",
      "Tip": "near1ztgk4pxq8jydmvw7x5k3n9cylm5j6xr9qgpyld"
    }
  ]);
});

