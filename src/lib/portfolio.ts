import { DAD_HOLDINGS } from "./dad-holdings";
import type { ProfileId } from "./profiles";

export const GOAL_TWD = 100_000;

export type SourceId =
  | "binance-spot"
  | "binance-web3"
  | "okx-web3"
  | "okx-defi"
  | "unknown-ex"
  | "bitget"
  | "bitget-spot"
  | "mexc";

export type HoldingKind = "exchange" | "wallet" | "defi";

export type Holding = {
  id: string;
  source: SourceId;
  kind: HoldingKind;
  symbol: string;
  name: string;
  quantity: number | null;
  snapshotValueTwd: number;
  snapshotPnlTwd: number | null;
  snapshotReturn: number | null;
  costTwd: number | null;
  priceKey: string | null;
  notes?: string;
  hidden?: boolean;
};

export const SOURCES: Record<
  SourceId,
  { label: string; short: string; kind: HoldingKind }
> = {
  "binance-spot": { label: "Binance 現貨", short: "Binance", kind: "exchange" },
  "binance-web3": { label: "Binance 錢包", short: "Binance 錢包", kind: "wallet" },
  "okx-web3": { label: "OKX 錢包", short: "OKX 錢包", kind: "wallet" },
  "okx-defi": { label: "OKX DeFi", short: "DeFi", kind: "defi" },
  "unknown-ex": { label: "其他交易所", short: "其他交易所", kind: "exchange" },
  bitget: { label: "Bitget 錢包", short: "Bitget", kind: "wallet" },
  "bitget-spot": { label: "Bitget 現貨", short: "Bitget", kind: "exchange" },
  mexc: { label: "MEXC 現貨", short: "MEXC", kind: "exchange" },
};

export const SYMBOL_META: Record<string, { name: string; binance: string | null }> =
  {
    BTC: { name: "比特幣", binance: "BTCUSDT" },
    ETH: { name: "以太幣", binance: "ETHUSDT" },
    SOL: { name: "Solana", binance: "SOLUSDT" },
    BNB: { name: "BNB", binance: "BNBUSDT" },
    SUI: { name: "Sui", binance: "SUIUSDT" },
    SEI: { name: "Sei", binance: "SEIUSDT" },
    ARB: { name: "Arbitrum", binance: "ARBUSDT" },
    ADA: { name: "Cardano", binance: "ADAUSDT" },
    APT: { name: "Aptos", binance: "APTUSDT" },
    OP: { name: "Optimism", binance: "OPUSDT" },
    POL: { name: "Polygon", binance: "POLUSDT" },
    CRCLX: { name: "Circle 股票代幣", binance: "CRCLXUSDT" },
    CRCLB: { name: "Circle 股票代幣", binance: "CRCLBUSDT" },
    SPCXB: { name: "SpaceX 股票代幣", binance: "SPCXBUSDT" },
    TSLAB: { name: "Tesla 股票代幣", binance: "TSLABUSDT" },
    BITLAYER_BTC: { name: "Bitlayer 比特幣", binance: "BTCUSDT" },
    MNT: { name: "Mantle", binance: "MNTUSDT" },
    CHIP: { name: "USD.AI", binance: "CHIPUSDT" },
    USD1: { name: "USD1", binance: "USD1USDT" },
    ERA: { name: "Caldera", binance: "ERAUSDT" },
    USDT: { name: "Tether", binance: null },
    USDC: { name: "USD Coin", binance: null },
    "USDT-TYB": { name: "PancakeSwap", binance: null },
    SYND: { name: "Syndicate", binance: "SYNDUSDT" },
    LUCE: { name: "LUCE", binance: "LUCEUSDT" },
    THRUST: { name: "THRUST", binance: "THRUSTUSDT" },
    DOGE: { name: "狗狗幣", binance: "DOGEUSDT" },
    XRP: { name: "XRP", binance: "XRPUSDT" },
    LINK: { name: "Chainlink", binance: "LINKUSDT" },
    AVAX: { name: "Avalanche", binance: "AVAXUSDT" },
    TON: { name: "Toncoin", binance: "TONUSDT" },
    DOT: { name: "Polkadot", binance: "DOTUSDT" },
    UNI: { name: "Uniswap", binance: "UNIUSDT" },
    NEAR: { name: "NEAR", binance: "NEARUSDT" },
    AAVE: { name: "Aave", binance: "AAVEUSDT" },
    PEPE: { name: "PEPE", binance: "PEPEUSDT" },
    WLD: { name: "Worldcoin", binance: "WLDUSDT" },
    TRX: { name: "TRON", binance: "TRXUSDT" },
    SHIB: { name: "SHIBA INU", binance: "SHIBUSDT" },
    SXT: { name: "Space and Time", binance: "SXTUSDT" },
    ARTX: { name: "ULTILAND", binance: null },
    GENIUS: { name: "Genius Terminal", binance: null },
    ACT: { name: "Act I", binance: "ACTUSDT" },
    WLFI: { name: "WLFI", binance: "WLFIUSDT" },
    MON: { name: "MON", binance: null },
    NODE: { name: "NODE", binance: null },
    SPACEXPRE: { name: "SpaceX 預上市", binance: null },
    OTHER: { name: "其他小額資產", binance: null },
  };

const SUI_SPOT_QTY = 23.93614254;
const SUI_SPOT_VALUE = 598.78;
const SUI_SNAPSHOT_PX = SUI_SPOT_VALUE / SUI_SPOT_QTY;
const SUILEND_VALUE = 2879.93;

export const HOLDINGS: Holding[] = [
  {
    id: "bn-btc",
    source: "binance-spot",
    kind: "exchange",
    symbol: "BTC",
    name: "比特幣",
    quantity: 0.01426966,
    snapshotValueTwd: 36485.74,
    snapshotPnlTwd: 2717.99,
    snapshotReturn: 0.0805,
    costTwd: 33767.75,
    priceKey: "BTC",
  },
  {
    id: "bn-eth",
    source: "binance-spot",
    kind: "exchange",
    symbol: "ETH",
    name: "以太幣",
    quantity: 0.15694112,
    snapshotValueTwd: 12568.24,
    snapshotPnlTwd: -88.78,
    snapshotReturn: -0.007,
    costTwd: 12657.02,
    priceKey: "ETH",
  },
  {
    id: "bn-sol",
    source: "binance-spot",
    kind: "exchange",
    symbol: "SOL",
    name: "Solana",
    quantity: 1.80848226,
    snapshotValueTwd: 6152.88,
    snapshotPnlTwd: 210.16,
    snapshotReturn: 0.0354,
    costTwd: 5942.72,
    priceKey: "SOL",
  },
  {
    id: "bn-bnb",
    source: "binance-spot",
    kind: "exchange",
    symbol: "BNB",
    name: "BNB",
    quantity: 0.23390415,
    snapshotValueTwd: 5282.68,
    snapshotPnlTwd: -223.47,
    snapshotReturn: -0.0406,
    costTwd: 5506.15,
    priceKey: "BNB",
  },
  {
    id: "bn-arb",
    source: "binance-spot",
    kind: "exchange",
    symbol: "ARB",
    name: "Arbitrum",
    quantity: 234.50739992,
    snapshotValueTwd: 685.93,
    snapshotPnlTwd: -2097.51,
    snapshotReturn: -0.7536,
    costTwd: 2783.44,
    priceKey: "ARB",
  },
  {
    id: "bn-spcxb",
    source: "binance-spot",
    kind: "exchange",
    symbol: "SPCXB",
    name: "SpaceX 股票代幣",
    quantity: 0.14805372,
    snapshotValueTwd: 659.9,
    snapshotPnlTwd: 28.97,
    snapshotReturn: 0.0459,
    costTwd: 630.93,
    priceKey: "SPCXB",
  },
  {
    id: "bn-ada",
    source: "binance-spot",
    kind: "exchange",
    symbol: "ADA",
    name: "Cardano",
    quantity: 90.56160225,
    snapshotValueTwd: 618.74,
    snapshotPnlTwd: -390.93,
    snapshotReturn: -0.3872,
    costTwd: 1009.67,
    priceKey: "ADA",
  },
  {
    id: "bn-apt",
    source: "binance-spot",
    kind: "exchange",
    symbol: "APT",
    name: "Aptos",
    quantity: 33.67259996,
    snapshotValueTwd: 616.77,
    snapshotPnlTwd: -5407.54,
    snapshotReturn: -0.8976,
    costTwd: 6024.31,
    priceKey: "APT",
  },
  {
    id: "bn-sui",
    source: "binance-spot",
    kind: "exchange",
    symbol: "SUI",
    name: "Sui",
    quantity: SUI_SPOT_QTY,
    snapshotValueTwd: SUI_SPOT_VALUE,
    snapshotPnlTwd: -1355.01,
    snapshotReturn: -0.6936,
    costTwd: 1953.79,
    priceKey: "SUI",
  },
  {
    id: "bn-sei",
    source: "binance-spot",
    kind: "exchange",
    symbol: "SEI",
    name: "Sei",
    quantity: 256.08834546,
    snapshotValueTwd: 392.54,
    snapshotPnlTwd: -1367.67,
    snapshotReturn: -0.777,
    costTwd: 1760.21,
    priceKey: "SEI",
  },
  {
    id: "bn-op",
    source: "binance-spot",
    kind: "exchange",
    symbol: "OP",
    name: "Optimism",
    quantity: 123.98725138,
    snapshotValueTwd: 387.41,
    snapshotPnlTwd: -3167.43,
    snapshotReturn: -0.891,
    costTwd: 3554.84,
    priceKey: "OP",
  },
  {
    id: "bn-pol",
    source: "binance-spot",
    kind: "exchange",
    symbol: "POL",
    name: "Polygon",
    quantity: 100.6030332,
    snapshotValueTwd: 344.76,
    snapshotPnlTwd: 344.66,
    snapshotReturn: null,
    costTwd: 0.1,
    priceKey: "POL",
  },
  {
    id: "bn-tslab",
    source: "binance-spot",
    kind: "exchange",
    symbol: "TSLAB",
    name: "Tesla 股票代幣",
    quantity: 0.0087,
    snapshotValueTwd: 97.33,
    snapshotPnlTwd: 97.33,
    snapshotReturn: null,
    costTwd: 0,
    priceKey: "TSLAB",
  },
  {
    id: "bn-chip",
    source: "binance-spot",
    kind: "exchange",
    symbol: "CHIP",
    name: "USD.AI",
    quantity: 41.18550208,
    snapshotValueTwd: 54.68,
    snapshotPnlTwd: 54.68,
    snapshotReturn: null,
    costTwd: 0,
    priceKey: "CHIP",
  },
  {
    id: "bn-usd1",
    source: "binance-spot",
    kind: "exchange",
    symbol: "USD1",
    name: "USD1",
    quantity: 0.9594089,
    snapshotValueTwd: 30.400931,
    snapshotPnlTwd: null,
    snapshotReturn: null,
    costTwd: null,
    priceKey: "USD1",
  },
  {
    id: "bn-era",
    source: "binance-spot",
    kind: "exchange",
    symbol: "ERA",
    name: "Caldera",
    quantity: 12.33734703,
    snapshotValueTwd: 22.480805,
    snapshotPnlTwd: 22.48,
    snapshotReturn: null,
    costTwd: 0.000805,
    priceKey: "ERA",
  },
  {
    id: "w3-btc",
    source: "binance-web3",
    kind: "wallet",
    symbol: "BITLAYER_BTC",
    name: "Bitlayer 比特幣",
    quantity: 0.00019281,
    snapshotValueTwd: 493.27,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0338,
    costTwd: null,
    priceKey: "BTC",
  },
  {
    id: "w3-sol",
    source: "binance-web3",
    kind: "wallet",
    symbol: "SOL",
    name: "Solana",
    quantity: 0.099067,
    snapshotValueTwd: 338.09,
    snapshotPnlTwd: null,
    snapshotReturn: 0.126,
    costTwd: null,
    priceKey: "SOL",
  },
  {
    id: "w3-bnb",
    source: "binance-web3",
    kind: "wallet",
    symbol: "BNB",
    name: "BNB",
    quantity: 0.012274,
    snapshotValueTwd: 277.11,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0259,
    costTwd: null,
    priceKey: "BNB",
  },
  {
    id: "w3-dust",
    source: "binance-web3",
    kind: "wallet",
    symbol: "OTHER",
    name: "其他小額資產",
    quantity: null,
    snapshotValueTwd: 35.25,
    snapshotPnlTwd: null,
    snapshotReturn: null,
    costTwd: null,
    priceKey: null,
    notes: "含 BTCB、HUMA、MYX 等 16 種",
  },
  {
    id: "okx-eth",
    source: "okx-web3",
    kind: "wallet",
    symbol: "ETH",
    name: "以太幣",
    quantity: 0.002471,
    snapshotValueTwd: 197.9,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0363,
    costTwd: null,
    priceKey: "ETH",
  },
  {
    id: "okx-bnb",
    source: "okx-web3",
    kind: "wallet",
    symbol: "BNB",
    name: "BNB",
    quantity: 0.003094,
    snapshotValueTwd: 69.9,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0282,
    costTwd: null,
    priceKey: "BNB",
  },
  {
    id: "okx-sui",
    source: "okx-web3",
    kind: "wallet",
    symbol: "SUI",
    name: "Sui",
    quantity: 1.338377,
    snapshotValueTwd: 33.46,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0794,
    costTwd: null,
    priceKey: "SUI",
  },
  {
    id: "okx-sol",
    source: "okx-web3",
    kind: "wallet",
    symbol: "SOL",
    name: "Solana",
    quantity: 0.001691,
    snapshotValueTwd: 5.74,
    snapshotPnlTwd: null,
    snapshotReturn: 0.1235,
    costTwd: null,
    priceKey: "SOL",
  },
  {
    id: "okx-usdt",
    source: "okx-web3",
    kind: "wallet",
    symbol: "USDT",
    name: "Tether",
    quantity: null,
    snapshotValueTwd: 0.01,
    snapshotPnlTwd: null,
    snapshotReturn: null,
    costTwd: null,
    priceKey: "USDT",
    hidden: true,
  },
  {
    id: "defi-sui",
    source: "okx-defi",
    kind: "defi",
    symbol: "SUI",
    name: "Suilend",
    quantity: SUILEND_VALUE / SUI_SNAPSHOT_PX,
    snapshotValueTwd: SUILEND_VALUE,
    snapshotPnlTwd: 107.54,
    snapshotReturn: null,
    costTwd: 2772.39,
    priceKey: "SUI",
    notes: "截圖未列出顆數，依當時 Sui 價格反推",
  },
  {
    id: "defi-tyb",
    source: "okx-defi",
    kind: "defi",
    symbol: "USDT-TYB",
    name: "PancakeSwap",
    quantity: null,
    snapshotValueTwd: 0.11,
    snapshotPnlTwd: null,
    snapshotReturn: null,
    costTwd: null,
    priceKey: "USDT",
    hidden: true,
  },
  {
    id: "ex-crclx",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "CRCLX",
    name: "Circle 股票代幣",
    quantity: 0.325486,
    snapshotValueTwd: 974.75,
    snapshotPnlTwd: 133.69,
    snapshotReturn: 0.1593,
    costTwd: 841.06,
    priceKey: "CRCLX",
    notes: "截圖未顯示交易所名稱",
  },
  {
    id: "ex-sol",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "SOL",
    name: "Solana",
    quantity: 0.15039769,
    snapshotValueTwd: 510.91,
    snapshotPnlTwd: -130.84,
    snapshotReturn: -0.2042,
    costTwd: 641.75,
    priceKey: "SOL",
  },
  {
    id: "ex-mnt",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "MNT",
    name: "Mantle",
    quantity: 1.6,
    snapshotValueTwd: 26.61,
    snapshotPnlTwd: -7.6,
    snapshotReturn: -0.2269,
    costTwd: 34.21,
    priceKey: "MNT",
  },
  {
    id: "ex-synd",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "SYND",
    name: "Syndicate",
    quantity: 1.7853,
    snapshotValueTwd: 0.63,
    snapshotPnlTwd: -8.55,
    snapshotReturn: -0.9128,
    costTwd: 9.18,
    priceKey: "SYND",
  },
  {
    id: "ex-usdt",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "USDT",
    name: "Tether",
    quantity: 0.0326,
    snapshotValueTwd: 1.03,
    snapshotPnlTwd: 0,
    snapshotReturn: 0,
    costTwd: 1.03,
    priceKey: "USDT",
  },
  {
    id: "ex-luce",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "LUCE",
    name: "LUCE",
    quantity: 0.8157,
    snapshotValueTwd: 0,
    snapshotPnlTwd: 0,
    snapshotReturn: 0,
    costTwd: null,
    priceKey: "LUCE",
    hidden: true,
  },
  {
    id: "ex-thrust",
    source: "unknown-ex",
    kind: "exchange",
    symbol: "THRUST",
    name: "THRUST",
    quantity: 0.5692,
    snapshotValueTwd: 0,
    snapshotPnlTwd: 0,
    snapshotReturn: 0,
    costTwd: null,
    priceKey: "THRUST",
    hidden: true,
  },
  {
    id: "bg-eth",
    source: "bitget",
    kind: "wallet",
    symbol: "ETH",
    name: "以太幣",
    quantity: 0.0022,
    snapshotValueTwd: 178.51,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0339,
    costTwd: null,
    priceKey: "ETH",
  },
  {
    id: "bg-bnb",
    source: "bitget",
    kind: "wallet",
    symbol: "BNB",
    name: "BNB",
    quantity: 0.0045,
    snapshotValueTwd: 102.82,
    snapshotPnlTwd: null,
    snapshotReturn: 0.0268,
    costTwd: null,
    priceKey: "BNB",
  },
  {
    id: "bg-sei",
    source: "bitget",
    kind: "wallet",
    symbol: "SEI",
    name: "Sei",
    quantity: 40.746,
    snapshotValueTwd: 78.84,
    snapshotPnlTwd: null,
    snapshotReturn: 0,
    costTwd: null,
    priceKey: "SEI",
  },
];

export type PriceQuote = {
  twd: number;
  usd: number;
  change24h?: number;
};

export type PriceBook = {
  quotes: Record<string, PriceQuote>;
  usdTwd: number;
  fetchedAt: number;
  source: string;
};

export type ValuedHolding = Holding & {
  quantityUsed: number | null;
  valueTwd: number;
  unitPriceTwd: number | null;
  unitPriceUsd: number | null;
  valueSource: "live" | "snapshot";
  pnlTwd: number | null;
  pnlPct: number | null;
  change24h: number | null;
};

export type SymbolRow = {
  symbol: string;
  name: string;
  quantity: number | null;
  valueTwd: number;
  share: number;
  sources: number;
  unitPriceTwd: number | null;
  unitPriceUsd: number | null;
  pnlTwd: number | null;
  costTwd: number | null;
  change24h: number | null;
};

export type SourceRow = {
  source: SourceId;
  label: string;
  valueTwd: number;
  share: number;
};

export type MajorQuote = {
  symbol: string;
  name: string;
  usd: number;
  twd: number;
  change24h: number | null;
};

export type PortfolioView = {
  goalTwd: number;
  holdings: ValuedHolding[];
  visible: ValuedHolding[];
  totalTwd: number;
  gapTwd: number;
  progress: number;
  neededRatio: number;
  liveCount: number;
  pricedRatio: number;
  totalPnlTwd: number | null;
  totalCostTwd: number;
  todayDeltaTwd: number | null;
  todayDeltaPct: number | null;
  majors: MajorQuote[];
  bySymbol: SymbolRow[];
  bySource: SourceRow[];
};

export type PortfolioExtras = {
  custom?: Holding[];
  costOverrides?: Record<string, number>;
  hiddenIds?: string[];
};

export function snapshotUnitPrice(h: Holding): number | null {
  if (h.quantity && h.quantity > 0 && h.snapshotValueTwd > 0) {
    return h.snapshotValueTwd / h.quantity;
  }
  return null;
}

export function valueHolding(
  holding: Holding,
  book: PriceBook | null,
  qtyOverride?: number,
  costOverride?: number,
): ValuedHolding {
  const quantityUsed =
    qtyOverride !== undefined ? qtyOverride : holding.quantity;
  const quote = holding.priceKey ? book?.quotes[holding.priceKey] : undefined;
  const costTwd =
    costOverride !== undefined ? costOverride : holding.costTwd;

  let valueTwd = holding.snapshotValueTwd;
  let valueSource: "live" | "snapshot" = "snapshot";
  let unitPriceTwd = snapshotUnitPrice(holding);
  let unitPriceUsd: number | null = null;
  const change24h =
    quote?.change24h !== undefined && Number.isFinite(quote.change24h)
      ? quote.change24h
      : null;

  if (quote && quantityUsed !== null && quantityUsed >= 0) {
    valueTwd = quantityUsed * quote.twd;
    valueSource = "live";
    unitPriceTwd = quote.twd;
    unitPriceUsd = quote.usd;
  } else if (quote && quantityUsed === null && unitPriceTwd && unitPriceTwd > 0) {
    const ratio = quote.twd / unitPriceTwd;
    valueTwd = holding.snapshotValueTwd * ratio;
    valueSource = "live";
    unitPriceTwd = quote.twd;
    unitPriceUsd = quote.usd;
  }

  let pnlTwd: number | null = null;
  let pnlPct: number | null = null;
  if (costTwd !== null && Number.isFinite(costTwd)) {
    pnlTwd = valueTwd - costTwd;
    if (costTwd > 1) {
      pnlPct = pnlTwd / costTwd;
    }
  } else if (valueSource === "snapshot") {
    pnlTwd = holding.snapshotPnlTwd;
    pnlPct = holding.snapshotReturn;
  }

  return {
    ...holding,
    costTwd,
    quantityUsed,
    valueTwd,
    unitPriceTwd,
    unitPriceUsd,
    valueSource,
    pnlTwd,
    pnlPct,
    change24h,
  };
}

export function buildPortfolio(
  book: PriceBook | null,
  qtyOverrides: Record<string, number> = {},
  goalTwd: number = GOAL_TWD,
  extras: PortfolioExtras = {},
  seed: Holding[] = HOLDINGS,
): PortfolioView {
  const hidden = new Set(extras.hiddenIds ?? []);
  const merged: Holding[] = [...seed, ...(extras.custom ?? [])].map((h) =>
    hidden.has(h.id) ? { ...h, hidden: true } : h,
  );
  const holdings = merged.map((h) =>
    valueHolding(h, book, qtyOverrides[h.id], extras.costOverrides?.[h.id]),
  );
  const counted = holdings.filter((h) => !h.hidden);
  const visible = counted
    .filter((h) => h.valueTwd >= 0.01)
    .sort((a, b) => b.valueTwd - a.valueTwd);

  const safeGoal = goalTwd > 0 ? goalTwd : GOAL_TWD;
  const totalTwd = counted.reduce((sum, h) => sum + h.valueTwd, 0);
  const gapTwd = safeGoal - totalTwd;
  const progress = totalTwd / safeGoal;
  const neededRatio = totalTwd > 0 ? Math.max(0, gapTwd) / totalTwd : 0;
  const liveCount = holdings.filter((h) => h.valueSource === "live").length;
  const pricedRatio = holdings.length ? liveCount / holdings.length : 0;

  const withCost = counted.filter((h) => h.costTwd !== null);
  const totalCostTwd = withCost.reduce((sum, h) => sum + (h.costTwd ?? 0), 0);
  const pnlParts = counted.filter((h) => h.pnlTwd !== null);
  const totalPnlTwd =
    pnlParts.length > 0
      ? pnlParts.reduce((sum, h) => sum + (h.pnlTwd ?? 0), 0)
      : null;

  let todayBase = 0;
  let todayNow = 0;
  for (const h of counted) {
    if (h.change24h === null || h.valueTwd <= 0) continue;
    const ratio = h.change24h;
    const prev = h.valueTwd / (1 + ratio);
    todayBase += prev;
    todayNow += h.valueTwd;
  }
  const todayDeltaTwd = todayBase > 0 ? todayNow - todayBase : null;
  const todayDeltaPct =
    todayBase > 0 && todayDeltaTwd !== null ? todayDeltaTwd / todayBase : null;

  const majors: MajorQuote[] = [];
  for (const symbol of ["BTC", "ETH", "SOL"]) {
    const quote = book?.quotes[symbol];
    if (!quote) continue;
    majors.push({
      symbol,
      name: SYMBOL_META[symbol]?.name ?? symbol,
      usd: quote.usd,
      twd: quote.twd,
      change24h: quote.change24h ?? null,
    });
  }

  const symbolMap = new Map<string, ValuedHolding[]>();
  for (const h of holdings) {
    if (h.hidden) continue;
    const list = symbolMap.get(h.symbol) ?? [];
    list.push(h);
    symbolMap.set(h.symbol, list);
  }

  const bySymbol: SymbolRow[] = [...symbolMap.entries()]
    .map(([symbol, list]) => {
      const valueTwd = list.reduce((s, h) => s + h.valueTwd, 0);
      const qtyVals = list
        .map((h) => h.quantityUsed)
        .filter((q): q is number => q !== null);
      const quantity = qtyVals.length ? qtyVals.reduce((s, q) => s + q, 0) : null;
      const costParts = list.filter((h) => h.costTwd !== null);
      const costTwd = costParts.length
        ? costParts.reduce((s, h) => s + (h.costTwd ?? 0), 0)
        : null;
      const pnlPartsInner = list.filter((h) => h.pnlTwd !== null);
      const pnlTwd = pnlPartsInner.length
        ? pnlPartsInner.reduce((s, h) => s + (h.pnlTwd ?? 0), 0)
        : null;
      const priced = list.find((h) => h.unitPriceTwd !== null);
      return {
        symbol,
        name: list[0]?.name ?? symbol,
        quantity,
        valueTwd,
        share: totalTwd > 0 ? valueTwd / totalTwd : 0,
        sources: list.length,
        unitPriceTwd: priced?.unitPriceTwd ?? null,
        unitPriceUsd: priced?.unitPriceUsd ?? null,
        pnlTwd,
        costTwd,
        change24h: priced?.change24h ?? null,
      };
    })
    .filter((row) => row.valueTwd >= 0.01)
    .sort((a, b) => b.valueTwd - a.valueTwd);

  const sourceMap = new Map<SourceId, number>();
  for (const h of counted) {
    sourceMap.set(h.source, (sourceMap.get(h.source) ?? 0) + h.valueTwd);
  }
  const bySource: SourceRow[] = [...sourceMap.entries()]
    .map(([source, valueTwd]) => ({
      source,
      label: SOURCES[source].label,
      valueTwd,
      share: totalTwd > 0 ? valueTwd / totalTwd : 0,
    }))
    .filter((row) => row.valueTwd >= 0.01)
    .sort((a, b) => b.valueTwd - a.valueTwd);

  return {
    goalTwd: safeGoal,
    holdings,
    visible,
    totalTwd,
    gapTwd,
    progress,
    neededRatio,
    liveCount,
    pricedRatio,
    totalPnlTwd,
    totalCostTwd,
    todayDeltaTwd,
    todayDeltaPct,
    majors,
    bySymbol,
    bySource,
  };
}

export type GoalPath = {
  id: string;
  title: string;
  detail: string;
  ratio: number;
  feasible: boolean;
  basketValue: number;
  implied?: { label: string; from: string; to: string } | null;
};

export function growthNeeded(gap: number, basketValue: number): number {
  if (basketValue <= 0) return Number.POSITIVE_INFINITY;
  return gap / basketValue;
}

export function applyUniformGrowth(total: number, ratio: number): number {
  return total * (1 + ratio);
}

export function btcQuantity(view: PortfolioView): number {
  return view.holdings
    .filter((h) => h.priceKey === "BTC" && h.quantityUsed !== null)
    .reduce((s, h) => s + (h.quantityUsed ?? 0), 0);
}

export const MAJOR_SYMBOLS = ["BTC", "ETH", "SOL"] as const;
export const CORE_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "SUI"] as const;

export function basketValue(view: PortfolioView, symbols: readonly string[]): number {
  const set = new Set(symbols);
  return view.holdings
    .filter((h) => set.has(h.symbol) || (h.priceKey !== null && set.has(h.priceKey)))
    .reduce((s, h) => s + h.valueTwd, 0);
}

export function seedHoldings(profile: ProfileId) {
  return profile === "dad" ? DAD_HOLDINGS : HOLDINGS;
}
