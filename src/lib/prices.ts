import { createServerFn } from "@tanstack/react-start";
import { SYMBOL_META, type PriceBook, type PriceQuote } from "./portfolio";

const USD_TWD_FALLBACK = 31.5;

const BINANCE_ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/ticker/price",
  "https://api.binance.com/api/v3/ticker/price",
  "https://api1.binance.com/api/v3/ticker/price",
];

type BinanceTicker = { symbol: string; price: string };
type OkxTicker = { instId: string; last: string };

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function fetchUsdTwd(): Promise<number> {
  const attempts: Array<() => Promise<number>> = [
    async () => {
      const data = (await fetchJson(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
      )) as { usd?: { twd?: number } };
      const n = data.usd?.twd;
      if (!n || !Number.isFinite(n)) throw new Error("no twd");
      return n;
    },
    async () => {
      const data = (await fetchJson("https://open.er-api.com/v6/latest/USD")) as {
        rates?: { TWD?: number };
      };
      const n = data.rates?.TWD;
      if (!n || !Number.isFinite(n)) throw new Error("no twd");
      return n;
    },
  ];

  for (const attempt of attempts) {
    try {
      const n = await attempt();
      if (n > 20 && n < 50) return n;
    } catch {
      /* next */
    }
  }
  return USD_TWD_FALLBACK;
}

function tickerMap(rows: BinanceTicker[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const n = Number(row.price);
    if (Number.isFinite(n) && n > 0) map[row.symbol] = n;
  }
  return map;
}

async function fetchBinanceTickers(): Promise<{ map: Record<string, number>; source: string }> {
  for (const url of BINANCE_ENDPOINTS) {
    try {
      const data = (await fetchJson(url)) as BinanceTicker[] | { code?: number; msg?: string };
      if (!Array.isArray(data) || data.length < 20) continue;
      return { map: tickerMap(data), source: url.includes("vision") ? "binance-vision" : "binance" };
    } catch {
      /* next */
    }
  }
  throw new Error("binance unavailable");
}

async function fetchOkxTickers(): Promise<Record<string, number>> {
  const data = (await fetchJson(
    "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
  )) as { data?: OkxTicker[] };
  const map: Record<string, number> = {};
  for (const row of data.data ?? []) {
    const n = Number(row.last);
    if (Number.isFinite(n) && n > 0) map[row.instId] = n;
  }
  return map;
}

function buildQuotes(
  tickers: Record<string, number>,
  okx: Record<string, number>,
  usdTwd: number,
): Record<string, PriceQuote> {
  const quotes: Record<string, PriceQuote> = {
    USDT: { usd: 1, twd: usdTwd },
    "USDT-TYB": { usd: 1, twd: usdTwd },
  };

  for (const [symbol, meta] of Object.entries(SYMBOL_META)) {
    if (quotes[symbol]) continue;
    let usd: number | undefined;
    if (meta.binance) usd = tickers[meta.binance];
    if (!usd) usd = okx[`${symbol}-USDT`];
    if (!usd || !Number.isFinite(usd)) continue;
    quotes[symbol] = { usd, twd: usd * usdTwd };
  }

  if (quotes.BTC) quotes.BITLAYER_BTC = quotes.BTC;
  return quotes;
}

async function loadPriceBook(): Promise<PriceBook> {
  const [usdTwd, binance] = await Promise.all([fetchUsdTwd(), fetchBinanceTickers()]);
  let okx: Record<string, number> = {};
  try {
    okx = await fetchOkxTickers();
  } catch {
    okx = {};
  }
  return {
    quotes: buildQuotes(binance.map, okx, usdTwd),
    usdTwd,
    fetchedAt: Date.now(),
    source: binance.source,
  };
}

export const getLivePrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<PriceBook> => loadPriceBook(),
);

export async function fetchPricesInBrowser(): Promise<PriceBook> {
  return loadPriceBook();
}
