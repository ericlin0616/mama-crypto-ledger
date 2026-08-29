import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  formatPct,
  formatQty,
  formatSignedPct,
  formatTwd,
  formatTwdNumber,
  formatUsd,
} from "@/lib/format";
import {
  SOURCES,
  isStableSymbol,
  type SourceId,
  type ValuedHolding,
  type PortfolioView,
} from "@/lib/portfolio";
import { useCountUp, useMotion } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

const SLICE_COLORS = [
  "var(--color-slice-1)",
  "var(--color-slice-2)",
  "var(--color-slice-3)",
  "var(--color-slice-4)",
  "var(--color-slice-5)",
  "var(--color-slice-6)",
];

type Props = {
  view: PortfolioView;
  onSelect: (id: string) => void;
  onAddEntry: () => void;
};

type PieRow = {
  name: string;
  value: number;
  holdingId: string | null;
  color: string;
};

export function HoldingsPanel({ view, onSelect, onAddEntry }: Props) {
  const [filter, setFilter] = useState<"all" | SourceId>("all");
  const [mode, setMode] = useState<"coin" | "account">("coin");
  const motion = useMotion();

  const sourceFilters = useMemo(
    () => [
      { id: "all" as const, label: "全部" },
      ...view.bySource.map((row) => ({
        id: row.source,
        label: SOURCES[row.source].short,
      })),
    ],
    [view.bySource],
  );

  useEffect(() => {
    if (filter !== "all" && !view.bySource.some((row) => row.source === filter)) {
      setFilter("all");
    }
  }, [filter, view.bySource]);

  const coinRows = useMemo(() => {
    return view.bySymbol
      .filter((row) => {
        if (filter === "all") return true;
        if (row.grouped) {
          return view.holdings.some(
            (h) =>
              isStableSymbol(h.symbol) &&
              h.source === filter &&
              h.valueTwd >= 0.01,
          );
        }
        return view.holdings.some(
          (h) => h.symbol === row.symbol && h.source === filter && h.valueTwd >= 0.01,
        );
      })
      .map((row) => ({
        key: row.symbol,
        title: row.name,
        subtitle: row.grouped
          ? row.valueUsd !== null
            ? `約 ${formatUsd(row.valueUsd, row.valueUsd >= 100 ? 0 : 2)}`
            : "美元穩定幣"
          : `${row.symbol}${row.quantity !== null ? ` · ${formatQty(row.quantity)}` : ""}`,
        value: row.valueTwd,
        valueUsd: row.valueUsd,
        grouped: row.grouped,
        parts: row.parts,
        usdTwd: view.usdTwd,
        pnlPct:
          row.costTwd && row.costTwd > 1 && row.pnlTwd !== null
            ? row.pnlTwd / row.costTwd
            : null,
        change24h: row.change24h,
        share: row.share,
        holdingId: row.grouped
          ? null
          : view.visible.find((h) => h.symbol === row.symbol)?.id ?? null,
      }));
  }, [filter, view]);

  const groups = view.bySource.filter((s) => filter === "all" || s.source === filter);

  const pieRows: PieRow[] = useMemo(() => {
    const raw =
      mode === "coin"
        ? coinRows.map((row) => ({
            name: row.title,
            value: row.value,
            holdingId: row.holdingId,
          }))
        : groups.map((g) => ({
            name: g.label,
            value: g.valueTwd,
            holdingId: null as string | null,
          }));
    const top = raw.slice(0, 5);
    const rest = raw.slice(5).reduce((sum, row) => sum + row.value, 0);
    const rows = [
      ...top.map((row, i) => ({ ...row, color: SLICE_COLORS[i] })),
      ...(rest > 0
        ? [{ name: "其他", value: rest, holdingId: null, color: SLICE_COLORS[5] }]
        : []),
    ];
    return rows;
  }, [mode, coinRows, groups]);

  const pieTotal = pieRows.reduce((sum, row) => sum + row.value, 0);
  const pieShown = useCountUp(pieTotal, 800);

  return (
    <div className="flex flex-col gap-4">
      <section className="enter-card rounded-xl bg-paper p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <h2 className="font-serif text-lg">持倉</h2>
            <button
              type="button"
              aria-label="記一筆買進或賣出"
              onPointerDown={onAddEntry}
              onClick={onAddEntry}
              className="flex size-11 items-center justify-center rounded-full text-faint transition-colors duration-150 hover:bg-bg hover:text-ink"
            >
              <Plus className="size-5" />
            </button>
          </div>
          <div className="flex rounded-md bg-bg p-1">
            <ModeBtn active={mode === "coin"} onClick={() => setMode("coin")}>
              依幣種
            </ModeBtn>
            <ModeBtn active={mode === "account"} onClick={() => setMode("account")}>
              依帳戶
            </ModeBtn>
          </div>
        </div>

        {pieRows.length > 0 ? (
          <div className="chart-hit mt-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieRows}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={92}
                    paddingAngle={1.4}
                    stroke="var(--color-paper)"
                    strokeWidth={2}
                    isAnimationActive={motion}
                    animationDuration={850}
                    animationBegin={40}
                    animationEasing="ease-out"
                    onClick={(_, index) => {
                      const id = pieRows[index]?.holdingId;
                      if (id) onSelect(id);
                    }}
                  >
                    {pieRows.map((row) => (
                      <Cell key={row.name} fill={row.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<PieTip total={pieTotal} />}
                    wrapperStyle={{ outline: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-center font-serif text-lg tabular-nums">
              {formatTwdNumber(Math.round(pieShown))}
            </p>
            <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2">
              {pieRows.map((row) => (
                <li key={row.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-pill"
                    style={{ background: row.color }}
                  />
                  <span className="min-w-0 truncate">{row.name}</span>
                  <span className="ml-auto tabular-nums text-faint">
                    {pieTotal > 0 ? formatPct(row.value / pieTotal) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {sourceFilters.map((f) => (
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
        <ul className="enter-list flex flex-col gap-2">
          {coinRows.map((row, i) => (
            <li key={row.key} className="rounded-xl bg-paper shadow-card">
              <button
                type="button"
                onPointerDown={() => row.holdingId && onSelect(row.holdingId)}
                onClick={() => row.holdingId && onSelect(row.holdingId)}
                className="flex w-full min-h-16 items-center gap-3 px-4 py-3 text-left transition-transform duration-150 ease-out active:scale-[0.99]"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-md font-serif text-xs text-paper"
                  style={{ background: SLICE_COLORS[Math.min(i, 5)] }}
                >
                  {row.title.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{row.title}</span>
                  <span className="block truncate text-xs text-faint">{row.subtitle}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm tabular-nums">
                    {row.grouped ? `換成 ${formatTwd(row.value)}` : formatTwd(row.value)}
                  </span>
                  <span
                    className={cn(
                      "block text-xs tabular-nums",
                      row.grouped
                        ? "text-faint"
                        : (row.change24h ?? row.pnlPct) === null
                          ? "text-faint"
                          : (row.change24h ?? row.pnlPct ?? 0) >= 0
                            ? "text-gain"
                            : "text-loss",
                    )}
                  >
                    {row.grouped
                      ? row.usdTwd
                        ? `1 美元 = ${formatTwd(row.usdTwd)}`
                        : "依即時匯率"
                      : row.change24h !== null
                        ? `今日 ${formatSignedPct(row.change24h)}`
                        : row.pnlPct === null
                          ? formatPct(row.share)
                          : formatSignedPct(row.pnlPct)}
                  </span>
                </span>
              </button>
              {row.grouped && row.parts.length > 1 ? (
                <ul className="border-t border-line px-4 py-2">
                  {row.parts.map((part) => (
                    <li
                      key={part.symbol}
                      className="flex items-baseline justify-between gap-3 py-1.5 text-xs"
                    >
                      <span className="text-muted">
                        {part.symbol}
                        {part.quantity !== null ? ` · ${formatQty(part.quantity)}` : ""}
                      </span>
                      <span className="tabular-nums text-faint">
                        換成 {formatTwd(part.valueTwd)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
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
          {groups.map((g, i) => {
            const items = view.visible.filter((h) => h.source === g.source);
            const stables = items.filter((h) => isStableSymbol(h.symbol));
            const rest = items.filter((h) => !isStableSymbol(h.symbol));
            const stableTwd = stables.reduce((s, h) => s + h.valueTwd, 0);
            const stableUsd =
              view.usdTwd && view.usdTwd > 0 ? stableTwd / view.usdTwd : null;
            return (
              <section key={g.source} className="rounded-xl bg-paper p-4 shadow-card">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="size-2.5 rounded-pill"
                      style={{ background: SLICE_COLORS[Math.min(i, 5)] }}
                    />
                    {g.label}
                  </h3>
                  <p className="text-sm tabular-nums text-muted">{formatTwd(g.valueTwd)}</p>
                </div>
                <ul className="divide-y divide-line">
                  {stableTwd >= 0.01 ? (
                    <li className="py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span>
                          <span className="block text-sm">穩定幣</span>
                          <span className="block text-xs text-faint">
                            {stableUsd !== null
                              ? `約 ${formatUsd(stableUsd, stableUsd >= 100 ? 0 : 2)}`
                              : stables.map((h) => h.symbol).join(" · ")}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-sm tabular-nums">
                            換成 {formatTwd(stableTwd)}
                          </span>
                          {view.usdTwd ? (
                            <span className="block text-xs tabular-nums text-faint">
                              1 美元 = {formatTwd(view.usdTwd)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  ) : null}
                  {rest.map((h) => (
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

function PieTip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number }[];
  total: number;
}) {
  const row = payload?.[0];
  if (!active || !row || row.value === undefined) return null;
  return (
    <div className="rounded-md bg-paper px-3 py-2 shadow-card">
      <p className="text-xs text-muted">{row.name}</p>
      <p className="font-serif text-lg tabular-nums tracking-tight">
        {formatTwdNumber(row.value)}
      </p>
      <p className="text-xs text-faint">
        {total > 0 ? formatPct(row.value / total) : ""}
      </p>
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
      <span className="text-right">
        <span className="block text-sm tabular-nums">{formatTwd(holding.valueTwd)}</span>
        {holding.change24h !== null ? (
          <span
            className={cn(
              "block text-xs tabular-nums",
              holding.change24h >= 0 ? "text-gain" : "text-loss",
            )}
          >
            {formatSignedPct(holding.change24h)}
          </span>
        ) : null}
      </span>
    </button>
  );
}
