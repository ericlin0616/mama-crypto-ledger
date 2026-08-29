import { SYMBOL_META, type PortfolioView } from "./portfolio";

export type TrendRange = "12h" | "7d" | "30d" | "90d";
export type TrendPoint = {
  t: number;
  totalTwd: number;
  btcTwd: number | null;
};

type Bag = {
  id: string;
  pair: string | null;
  qty: number;
  valueTwd: number;
  stable: boolean;
};

const RANGE: Record<TrendRange, { interval: string; limit: number; okx: string }> = {
  "12h": { interval: "12h", limit: 14, okx: "12H" },
  "7d": { interval: "4h", limit: 42, okx: "4H" },
  "30d": { interval: "1d", limit: 30, okx: "1D" },
  "90d": { interval: "1d", limit: 90, okx: "1D" },
};

const BINANCE_KLINE = [
  "https://data-api.binance.vision/api/v3/klines",
  "https://api.binance.com/api/v3/klines",
];

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

function bagsFromView(view: PortfolioView): Bag[] {
  const map = new Map<string, Bag>();
  for (const h of view.visible) {
    const key = h.priceKey ?? h.symbol;
    const stable = key === "USDT" || key === "USDT-TYB" || key === "USD1" || key === "USDC";
    const pair = stable
      ? null
      : (SYMBOL_META[key]?.binance ?? (key ? `${key}USDT` : null));
    const prev = map.get(key);
    const qty = h.quantityUsed ?? 0;
    if (prev) {
      prev.qty += qty;
      prev.valueTwd += h.valueTwd;
    } else {
      map.set(key, { id: key, pair, qty, valueTwd: h.valueTwd, stable });
    }
  }
  return [...map.values()];
}

type Candle = { t: number; close: number };

async function fetchBinanceKlines(
  pair: string,
  interval: string,
  limit: number,
): Promise<Candle[]> {
  for (const base of BINANCE_KLINE) {
    try {
      const data = (await fetchJson(
        `${base}?symbol=${pair}&interval=${interval}&limit=${limit}`,
      )) as unknown;
      if (!Array.isArray(data) || data.length < 3) continue;
      const rows: Candle[] = [];
      for (const row of data) {
        if (!Array.isArray(row)) continue;
        const t = Number(row[0]);
        const close = Number(row[4]);
        if (Number.isFinite(t) && Number.isFinite(close) && close > 0) {
          rows.push({ t, close });
        }
      }
      if (rows.length >= 3) return rows;
    } catch {
      /* next */
    }
  }
  throw new Error(`klines ${pair}`);
}

async function fetchOkxKlines(
  pair: string,
  bar: string,
  limit: number,
): Promise<Candle[]> {
  const inst = pair.endsWith("USDT") ? `${pair.slice(0, -4)}-USDT` : pair;
  const data = (await fetchJson(
    `https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=${bar}&limit=${limit}`,
  )) as { data?: string[][] };
  const rows: Candle[] = [];
  for (const row of data.data ?? []) {
    const t = Number(row[0]);
    const close = Number(row[4]);
    if (Number.isFinite(t) && Number.isFinite(close) && close > 0) {
      rows.push({ t, close });
    }
  }
  rows.sort((a, b) => a.t - b.t);
  if (rows.length < 3) throw new Error(`okx ${pair}`);
  return rows;
}

async function fetchPair(
  pair: string,
  range: TrendRange,
): Promise<Candle[]> {
  const spec = RANGE[range];
  try {
    return await fetchBinanceKlines(pair, spec.interval, spec.limit);
  } catch {
    return fetchOkxKlines(pair, spec.okx, spec.limit);
  }
}

function closeAtOrBefore(rows: Candle[], t: number): number | null {
  let best: number | null = null;
  for (const row of rows) {
    if (row.t <= t) best = row.close;
    else break;
  }
  return best ?? rows[0]?.close ?? null;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function scaleBtc(
  firstTotal: number,
  firstBtc: number | null,
  close: number | null,
): number | null {
  if (!firstBtc || !close || firstTotal <= 0) return null;
  return firstTotal * (close / firstBtc);
}

export async function buildTrend(
  view: PortfolioView,
  range: TrendRange,
  usdTwd: number,
): Promise<TrendPoint[]> {
  const bags = bagsFromView(view);
  const pairs = [
    ...new Set([
      ...bags.map((b) => b.pair).filter((p): p is string => Boolean(p)),
      "BTCUSDT",
    ]),
  ];
  const seriesList = await mapPool(pairs, 5, async (pair) => {
    try {
      return { pair, rows: await fetchPair(pair, range) };
    } catch {
      return { pair, rows: [] as Candle[] };
    }
  });
  const series = new Map(seriesList.map((s) => [s.pair, s.rows]));
  const btcRows = series.get("BTCUSDT") ?? [];
  const spine =
    (btcRows.length >= 3 ? btcRows : null) ??
    seriesList.find((s) => s.rows.length >= 3)?.rows ??
    [];
  if (spine.length < 3) return [];

  const totals = spine.map((candle) => {
    let total = 0;
    for (const bag of bags) {
      if (bag.stable || !bag.pair || bag.qty <= 0) {
        total += bag.valueTwd;
        continue;
      }
      const rows = series.get(bag.pair) ?? [];
      const close = closeAtOrBefore(rows, candle.t);
      if (close && usdTwd > 0) total += bag.qty * close * usdTwd;
      else total += bag.valueTwd;
    }
    return { t: candle.t, totalTwd: total };
  });

  const firstTotal = totals[0]?.totalTwd ?? 0;
  const firstBtc = closeAtOrBefore(btcRows, totals[0]?.t ?? 0);
  const liveBtc = view.majors.find((m) => m.symbol === "BTC")?.usd ?? null;

  const points: TrendPoint[] = totals.map((row) => ({
    t: row.t,
    totalTwd: row.totalTwd,
    btcTwd: scaleBtc(firstTotal, firstBtc, closeAtOrBefore(btcRows, row.t)),
  }));

  const last = points[points.length - 1];
  if (last && Math.abs(last.totalTwd - view.totalTwd) > 1) {
    points.push({
      t: Date.now(),
      totalTwd: view.totalTwd,
      btcTwd: scaleBtc(firstTotal, firstBtc, liveBtc ?? closeAtOrBefore(btcRows, Date.now())),
    });
  } else if (last) {
    last.totalTwd = view.totalTwd;
    last.t = Date.now();
    last.btcTwd = scaleBtc(
      firstTotal,
      firstBtc,
      liveBtc ?? closeAtOrBefore(btcRows, Date.now()),
    );
  }
  return points;
}
