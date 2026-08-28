import { useMemo, useState } from "react";
import { formatPct, formatQty, formatSignedPct, formatTwd } from "@/lib/format";
import {
  SOURCES,
  type SourceId,
  type ValuedHolding,
  type PortfolioView,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | SourceId; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "binance-spot", label: "Binance" },
  { id: "okx-defi", label: "DeFi" },
  { id: "unknown-ex", label: "其他交易所" },
  { id: "binance-web3", label: "Binance 錢包" },
  { id: "okx-web3", label: "OKX 錢包" },
  { id: "bitget", label: "Bitget" },
];

type Props = {
  view: PortfolioView;
  onSelect: (id: string) => void;
};

export function HoldingsPanel({ view, onSelect }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [mode, setMode] = useState<"coin" | "account">("coin");

  const coinRows = useMemo(() => {
    return view.bySymbol
      .filter((row) => {
        if (filter === "all") return true;
        return view.holdings.some(
          (h) => h.symbol === row.symbol && h.source === filter && h.valueTwd >= 0.01,
        );
      })
      .map((row) => ({
        key: row.symbol,
        title: row.name,
        subtitle: `${row.symbol}${row.quantity !== null ? ` · ${formatQty(row.quantity)}` : ""}`,
        value: row.valueTwd,
        pnlPct:
          row.costTwd && row.costTwd > 1 && row.pnlTwd !== null
            ? row.pnlTwd / row.costTwd
            : null,
        share: row.share,
        holdingId: view.visible.find((h) => h.symbol === row.symbol)?.id ?? null,
      }));
  }, [filter, view]);

  const groups = view.bySource.filter((s) => filter === "all" || s.source === filter);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-paper p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">持倉</h2>
          <div className="flex rounded-md bg-bg p-1">
            <ModeBtn active={mode === "coin"} onClick={() => setMode("coin")}>
              依幣種
            </ModeBtn>
            <ModeBtn active={mode === "account"} onClick={() => setMode("account")}>
              依帳戶
            </ModeBtn>
          </div>
        </div>
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onPointerDown={() => setFilter(f.id)}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-10 shrink-0 rounded-pill px-4 text-sm transition-colors duration-150",
                filter === f.id ? "bg-ink text-paper" : "bg-bg text-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {mode === "coin" ? (
        <ul className="flex flex-col gap-2">
          {coinRows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onPointerDown={() => row.holdingId && onSelect(row.holdingId)}
                onClick={() => row.holdingId && onSelect(row.holdingId)}
                className="flex w-full min-h-16 items-center gap-3 rounded-xl bg-paper px-4 py-3 text-left shadow-card transition-transform duration-150 ease-out active:scale-[0.99]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft font-serif text-xs text-accent">
                  {row.title.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{row.title}</span>
                  <span className="block truncate text-xs text-faint">{row.subtitle}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm tabular-nums">{formatTwd(row.value)}</span>
                  <span
                    className={cn(
                      "block text-xs tabular-nums",
                      row.pnlPct === null
                        ? "text-faint"
                        : row.pnlPct >= 0
                          ? "text-gain"
                          : "text-loss",
                    )}
                  >
                    {row.pnlPct === null ? formatPct(row.share) : formatSignedPct(row.pnlPct)}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {coinRows.length === 0 ? (
            <li className="rounded-xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-card">
              這個分類目前沒有持倉
            </li>
          ) : null}
        </ul>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => {
            const items = view.visible.filter((h) => h.source === g.source);
            return (
              <section key={g.source} className="rounded-xl bg-paper p-4 shadow-card">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-sm font-medium">{g.label}</h3>
                  <p className="text-sm tabular-nums text-muted">{formatTwd(g.valueTwd)}</p>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((h) => (
                    <li key={h.id}>
                      <HoldingRow holding={h} onSelect={onSelect} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={onClick}
      onClick={onClick}
      className={cn(
        "h-10 rounded-sm px-3 text-xs font-medium transition-colors duration-150",
        active ? "bg-paper text-ink shadow-card" : "text-muted",
      )}
    >
      {children}
    </button>
  );
}

function HoldingRow({
  holding,
  onSelect,
}: {
  holding: ValuedHolding;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={() => onSelect(holding.id)}
      onClick={() => onSelect(holding.id)}
      className="flex w-full min-h-12 items-center justify-between gap-3 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm">{holding.name}</span>
        <span className="block text-xs text-faint">
          {holding.quantityUsed !== null ? formatQty(holding.quantityUsed) : holding.symbol}
        </span>
      </span>
      <span className="text-right text-sm tabular-nums">{formatTwd(holding.valueTwd)}</span>
    </button>
  );
}
