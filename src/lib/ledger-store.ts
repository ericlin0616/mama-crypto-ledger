import type { Holding, SourceId } from "./portfolio";
import { SYMBOL_META } from "./portfolio";
import type { ProfileId } from "./profiles";

function ns(profile: ProfileId, name: string) {
  return profile === "dad" ? `papa-ledger-${name}` : `mama-ledger-${name}`;
}

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

export function loadQty(profile: ProfileId = "mom"): Record<string, number> {
  const parsed = readJson<Record<string, number>>(ns(profile, "qty-v1"), {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveQty(qty: Record<string, number>, profile: ProfileId = "mom") {
  writeJson(ns(profile, "qty-v1"), qty);
}

export function loadGoal(fallback: number, profile: ProfileId = "mom"): number {
  const n = Number(readJson<string | number>(ns(profile, "goal-v1"), fallback));
  return Number.isFinite(n) && n >= 1000 ? n : fallback;
}

export function saveGoal(value: number, profile: ProfileId = "mom") {
  window.localStorage.setItem(ns(profile, "goal-v1"), String(value));
}

export function loadCost(profile: ProfileId = "mom"): Record<string, number> {
  const parsed = readJson<Record<string, number>>(ns(profile, "cost-v1"), {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveCost(cost: Record<string, number>, profile: ProfileId = "mom") {
  writeJson(ns(profile, "cost-v1"), cost);
}

export function loadCustom(profile: ProfileId = "mom"): Holding[] {
  const parsed = readJson<Holding[]>(ns(profile, "custom-v1"), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveCustom(list: Holding[], profile: ProfileId = "mom") {
  writeJson(ns(profile, "custom-v1"), list);
}

export function loadHidden(profile: ProfileId = "mom"): string[] {
  const parsed = readJson<string[]>(ns(profile, "hidden-v1"), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveHidden(ids: string[], profile: ProfileId = "mom") {
  writeJson(ns(profile, "hidden-v1"), ids);
}

export function loadLastVisit(profile: ProfileId = "mom"): LastVisit | null {
  const parsed = readJson<LastVisit | null>(ns(profile, "last-v1"), null);
  if (!parsed || !Number.isFinite(parsed.totalTwd) || !parsed.t) return null;
  return parsed;
}

export function saveLastVisit(totalTwd: number, profile: ProfileId = "mom") {
  writeJson(ns(profile, "last-v1"), { t: Date.now(), totalTwd } satisfies LastVisit);
}

export function taipeiDay(ts = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

export function loadHistory(profile: ProfileId = "mom"): HistoryPoint[] {
  const parsed = readJson<HistoryPoint[]>(ns(profile, "history-v1"), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function recordHistory(totalTwd: number, profile: ProfileId = "mom"): HistoryPoint[] {
  if (!Number.isFinite(totalTwd) || totalTwd < 1) return loadHistory(profile);
  const day = taipeiDay();
  const prev = loadHistory(profile).filter((p) => p.day !== day);
  const next = [...prev, { day, t: Date.now(), totalTwd }].slice(-30);
  writeJson(ns(profile, "history-v1"), next);
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
