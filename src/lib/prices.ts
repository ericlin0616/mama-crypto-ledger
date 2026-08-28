import { createServerFn } from "@tanstack/react-start";
import { SYMBOL_META, type PriceBook, type PriceQuote } from "./portfolio";

const USD_TWD_FALLBACK = 31.5;

const BINANCE_24H = [
  "https://data-api.binance.vision/api/v3/ticker/24hr",
  "https://api.binance.com/api/v3/ticker/24hr",
];

const BINANCE_PRICE = [
  "https://data-api.binance.vision/api/v3/ticker/price",
  "https://api.binance.com/api/v3/ticker/price",
  "https://api1.binance.com/api/v3/ticker/price",
];

type BinanceTicker = { symbol: string; price: string };
type Binance24hr = {
  symbol: string;
  lastPrice?: string;
  price?: string;
  priceChangePercent?: string;
};
type OkxTicker = { instId: string; last: string; open24h?: string };

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

async function fetchBinance(): Promise<{
  map: Record<string, number>;
  change: Record<string, number>;
  source: string;
}> {
  for (const url of BINANCE_24H) {
    try {
      const data = (await fetchJson(url)) as Binance24hr[] | { code?: number };
      if (!Array.isArray(data) || data.length < 20) continue;
      const map: Record<string, number> = {};
      const change: Record<string, number> = {};
      for (const row of data) {
        const price = Number(row.lastPrice ?? row.price);
        if (Number.isFinite(price) && price > 0) map[row.symbol] = price;
        const pct = Number(row.priceChangePercent);
        if (Number.isFinite(pct)) change[row.symbol] = pct / 100;
      }
      return {
        map,
        change,
        source: url.includes("vision") ? "binance-vision" : "binance",
      };
    } catch {
      /* next */
    }
  }

  for (const url of BINANCE_PRICE) {
    try {
      const data = (await fetchJson(url)) as BinanceTicker[] | { code?: number };
      if (!Array.isArray(data) || data.length < 20) continue;
      const map: Record<string, number> = {};
      for (const row of data) {
        const n = Number(row.price);
        if (Number.isFinite(n) && n > 0) map[row.symbol] = n;
      }
      return {
        map,
        change: {},
        source: url.includes("vision") ? "binance-vision" : "binance",
      };
    } catch {
      /* next */
    }
  }
  throw new Error("binance unavailable");
}

async function fetchOkxTickers(): Promise<{
  map: Record<string, number>;
  change: Record<string, number>;
}> {
  const data = (await fetchJson(
    "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
  )) as { data?: OkxTicker[] };
  const map: Record<string, number> = {};
  const change: Record<string, number> = {};
  for (const row of data.data ?? []) {
    const last = Number(row.last);
    if (Number.isFinite(last) && last > 0) map[row.instId] = last;
    const open = Number(row.open24h);
    if (Number.isFinite(open) && open > 0 && Number.isFinite(last)) {
      change[row.instId] = last / open - 1;
    }
  }
  return { map, change };
}

function buildQuotes(
  tickers: Record<string, number>,
  tickerChange: Record<string, number>,
  okx: Record<string, number>,
  okxChange: Record<string, number>,
  usdTwd: number,
  extraSymbols: string[],
): Record<string, PriceQuote> {
  const quotes: Record<string, PriceQuote> = {
    USDT: { usd: 1, twd: usdTwd, change24h: 0 },
    "USDT-TYB": { usd: 1, twd: usdTwd, change24h: 0 },
  };

  const symbols = new Set([
    ...Object.keys(SYMBOL_META),
    ...extraSymbols.map((s) => s.trim().toUpperCase()).filter(Boolean),
  ]);

  for (const symbol of symbols) {
    if (quotes[symbol]) continue;
    const meta = SYMBOL_META[symbol];
    const pair = meta?.binance ?? `${symbol}USDT`;
    let usd = pair ? tickers[pair] : undefined;
    let change = pair ? tickerChange[pair] : undefined;
    if (!usd) {
      usd = okx[`${symbol}-USDT`];
      change = okxChange[`${symbol}-USDT`];
    }
    if (!usd || !Number.isFinite(usd)) continue;
    quotes[symbol] = {
      usd,
      twd: usd * usdTwd,
      change24h: Number.isFinite(change) ? change : undefined,
    };
  }

  if (quotes.BTC) quotes.BITLAYER_BTC = quotes.BTC;
  return quotes;
}

async function loadPriceBook(extraSymbols: string[] = []): Promise<PriceBook> {
  const [usdTwd, binance] = await Promise.all([fetchUsdTwd(), fetchBinance()]);
  let okx: Record<string, number> = {};
  let okxChange: Record<string, number> = {};
  try {
    const fetched = await fetchOkxTickers();
    okx = fetched.map;
    okxChange = fetched.change;
  } catch {
    okx = {};
  }
  return {
    quotes: buildQuotes(
      binance.map,
      binance.change,
      okx,
      okxChange,
      usdTwd,
      extraSymbols,
    ),
    usdTwd,
    fetchedAt: Date.now(),
    source: binance.source,
  };
}

export const getLivePrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<PriceBook> => loadPriceBook(),
);

export async function fetchPricesInBrowser(
  extraSymbols: string[] = [],
): Promise<PriceBook> {
  return loadPriceBook(extraSymbols);
}
