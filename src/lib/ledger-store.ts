import type { Holding, SourceId } from "./portfolio";
import { SYMBOL_META } from "./portfolio";

const QTY_KEY = "mama-ledger-qty-v1";
const GOAL_KEY = "mama-ledger-goal-v1";
const COST_KEY = "mama-ledger-cost-v1";
const CUSTOM_KEY = "mama-ledger-custom-v1";
const HIDDEN_KEY = "mama-ledger-hidden-v1";
const LAST_KEY = "mama-ledger-last-v1";
const HISTORY_KEY = "mama-ledger-history-v1";

export type LastVisit = { t: number; totalTwd: number };
export type HistoryPoint = { day: string; t: number; totalTwd: number };

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadQty(): Record<string, number> {
  const parsed = readJson<Record<string, number>>(QTY_KEY, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveQty(qty: Record<string, number>) {
  writeJson(QTY_KEY, qty);
}

export function loadGoal(fallback: number): number {
  const n = Number(readJson<string | number>(GOAL_KEY, fallback));
  return Number.isFinite(n) && n >= 1000 ? n : fallback;
}

export function saveGoal(value: number) {
  window.localStorage.setItem(GOAL_KEY, String(value));
}

export function loadCost(): Record<string, number> {
  const parsed = readJson<Record<string, number>>(COST_KEY, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveCost(cost: Record<string, number>) {
  writeJson(COST_KEY, cost);
}

export function loadCustom(): Holding[] {
  const parsed = readJson<Holding[]>(CUSTOM_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveCustom(list: Holding[]) {
  writeJson(CUSTOM_KEY, list);
}

export function loadHidden(): string[] {
  const parsed = readJson<string[]>(HIDDEN_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveHidden(ids: string[]) {
  writeJson(HIDDEN_KEY, ids);
}

export function loadLastVisit(): LastVisit | null {
  const parsed = readJson<LastVisit | null>(LAST_KEY, null);
  if (!parsed || !Number.isFinite(parsed.totalTwd) || !parsed.t) return null;
  return parsed;
}

export function saveLastVisit(totalTwd: number) {
  writeJson(LAST_KEY, { t: Date.now(), totalTwd } satisfies LastVisit);
}

export function taipeiDay(ts = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

export function loadHistory(): HistoryPoint[] {
  const parsed = readJson<HistoryPoint[]>(HISTORY_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function recordHistory(totalTwd: number): HistoryPoint[] {
  if (!Number.isFinite(totalTwd) || totalTwd < 1) return loadHistory();
  const day = taipeiDay();
  const prev = loadHistory().filter((p) => p.day !== day);
  const next = [...prev, { day, t: Date.now(), totalTwd }].slice(-30);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function makeCustomHolding(input: {
  symbol: string;
  name: string;
  quantity: number;
  costTwd: number | null;
  source: SourceId;
}): Holding {
  const symbol = input.symbol.trim().toUpperCase();
  return {
    id: `custom-${symbol}`,
    source: input.source,
    kind:
      input.source.includes("web3") || input.source === "bitget"
        ? "wallet"
        : "exchange",
    symbol,
    name: input.name,
    quantity: input.quantity,
    snapshotValueTwd: 0,
    snapshotPnlTwd: null,
    snapshotReturn: null,
    costTwd: input.costTwd,
    priceKey: symbol,
    notes: "自己記的一筆",
  };
}

export function applyTrade(args: {
  holdings: {
    id: string;
    symbol: string;
    source: SourceId;
    quantity: number | null;
    costTwd: number | null;
  }[];
  custom: Holding[];
  qty: Record<string, number>;
  cost: Record<string, number>;
  hidden: string[];
  entry: {
    symbol: string;
    quantity: number;
    spentTwd: number | null;
    source: SourceId;
    side: "buy" | "sell";
  };
}): {
  qty: Record<string, number>;
  cost: Record<string, number>;
  custom: Holding[];
  hidden: string[];
} {
  const symbol = args.entry.symbol.toUpperCase();
  const all = [...args.holdings, ...args.custom];
  const matches = all.filter((h) => h.symbol === symbol);
  const sameSource = matches.find((h) => h.source === args.entry.source);
  const target = sameSource ?? matches[0] ?? null;

  const qty = { ...args.qty };
  const cost = { ...args.cost };
  let custom = [...args.custom];
  const hidden = args.hidden.filter(
    (id) => id !== target?.id && id !== `custom-${symbol}`,
  );

  if (!target) {
    const holding = makeCustomHolding({
      symbol,
      name: SYMBOL_META[symbol]?.name ?? symbol,
      quantity: args.entry.side === "buy" ? args.entry.quantity : 0,
      costTwd: args.entry.side === "buy" ? args.entry.spentTwd : null,
      source: args.entry.source,
    });
    custom = custom.filter((h) => h.id !== holding.id).concat(holding);
    qty[holding.id] = holding.quantity ?? 0;
    if (holding.costTwd !== null) cost[holding.id] = holding.costTwd;
    return { qty, cost, custom, hidden };
  }

  const currentQty = qty[target.id] ?? target.quantity ?? 0;
  const nextQty =
    args.entry.side === "buy"
      ? currentQty + args.entry.quantity
      : Math.max(0, currentQty - args.entry.quantity);
  qty[target.id] = nextQty;

  const currentCost = cost[target.id] ?? target.costTwd;
  if (args.entry.side === "buy" && args.entry.spentTwd) {
    cost[target.id] = (currentCost ?? 0) + args.entry.spentTwd;
  } else if (
    args.entry.side === "sell" &&
    currentCost !== null &&
    currentCost !== undefined &&
    currentQty > 0
  ) {
    cost[target.id] = currentCost * (nextQty / currentQty);
  }

  if (target.id.startsWith("custom-")) {
    custom = custom.map((h) =>
      h.id === target.id
        ? {
            ...h,
            quantity: nextQty,
            costTwd: cost[target.id] ?? h.costTwd,
          }
        : h,
    );
  }

  return { qty, cost, custom, hidden };
}
