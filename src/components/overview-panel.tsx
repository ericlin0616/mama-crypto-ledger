import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ChevronRight } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { Button } from "@/components/ui/button";
import {
  formatGoalShort,
  formatPct,
  formatTwd,
  formatTwdNumber,
  formatWan,
} from "@/lib/format";
import { SOURCES, type PortfolioView } from "@/lib/portfolio";
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
  live: boolean;
  onOpenGoal: () => void;
  onOpenHoldings: () => void;
};

export function OverviewPanel({ view, live, onOpenGoal, onOpenHoldings }: Props) {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    setChartReady(true);
  }, []);

  const goal = view.goalTwd;
  const reached = view.totalTwd >= goal;
  const top = view.bySymbol.slice(0, 5);
  const restValue = view.bySymbol.slice(5).reduce((s, r) => s + r.valueTwd, 0);
  const pieData = [
    ...top.map((row) => ({ name: row.name, value: row.valueTwd })),
    ...(restValue > 0 ? [{ name: "其他", value: restValue }] : []),
  ];

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
      <section className="rounded-xl bg-paper p-5 shadow-card">
        <p className="text-sm font-medium text-muted">目前總資產</p>
        <p className="mt-1 font-serif text-5xl leading-tight tracking-tight tabular-nums">
          {formatTwdNumber(view.totalTwd)}
        </p>
        <p className="mt-1 text-sm text-faint">
          新台幣 · {live ? "即時市價" : "依截圖估值"}
        </p>

        <ProgressRing progress={view.progress} className="mt-5">
          <p className="font-serif text-3xl tabular-nums leading-none">
            {formatPct(Math.min(view.progress, 9.99), 0)}
          </p>
          <p className="mt-1 text-xs text-muted">往 {formatGoalShort(goal)}</p>
        </ProgressRing>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat
            label={reached ? "已超過目標" : "還差"}
            value={formatTwd(Math.abs(view.gapTwd))}
          />
          <Stat
            label={view.totalPnlTwd !== null && view.totalPnlTwd >= 0 ? "估算獲利" : "估算虧損"}
            value={
              view.totalPnlTwd === null
                ? "—"
                : formatTwd(Math.abs(view.totalPnlTwd))
            }
            tone={
              view.totalPnlTwd === null
                ? "neutral"
                : view.totalPnlTwd >= 0
                  ? "gain"
                  : "loss"
            }
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          {reached
            ? `已經達到 ${formatGoalShort(goal)} 了。`
            : `現在大約 ${formatWan(view.totalTwd)}。想到 ${formatGoalShort(goal)}，還差 ${formatWan(view.gapTwd)}，相當於整體再漲 ${formatPct(view.neededRatio)}。`}
        </p>

        <Button
          className="mt-4 w-full"
          onPointerDown={onOpenGoal}
          onClick={onOpenGoal}
        >
          看怎麼到達標
        </Button>
      </section>

      <section className="rounded-xl bg-paper p-5 shadow-card">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-lg">幣種佔比</h2>
          <p className="text-xs text-faint">前五大 + 其他</p>
        </div>
        <div className="pointer-events-none mt-3 h-48 overflow-hidden">
          {chartReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={SLICE_COLORS[i] ?? "var(--color-slice-6)"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>
        <ul className="mt-1 flex flex-col gap-3">
          {pieData.map((row, i) => {
            const share = view.totalTwd > 0 ? row.value / view.totalTwd : 0;
            return (
              <li key={row.name} className="flex items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-pill"
                  style={{ background: SLICE_COLORS[i] }}
                />
                <span className="flex-1 text-sm">{row.name}</span>
                <span className="text-sm tabular-nums text-muted">{formatPct(share)}</span>
                <span className="w-20 text-right text-sm tabular-nums">
                  {formatTwd(row.value)}
                </span>
              </li>
            );
          })}
        </ul>
        {top[0] ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {top[0].name}就佔了 {formatPct(top[0].share)}，走勢幾乎決定這本帳。
          </p>
        ) : null}
      </section>

      <section className="rounded-xl bg-paper p-5 shadow-card">
        <h2 className="font-serif text-lg">放在哪裡</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {view.bySource.map((row) => (
            <li key={row.source}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">{row.label}</span>
                <span className="text-sm tabular-nums">{formatTwd(row.valueTwd)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line">
                <div
                  className="h-full rounded-pill bg-accent transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(2, row.share * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-faint">
                {SOURCES[row.source].kind === "wallet"
                  ? "錢包"
                  : SOURCES[row.source].kind === "defi"
                    ? "鏈上理財"
                    : "交易所"}
                · {formatPct(row.share)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onPointerDown={onOpenHoldings}
        onClick={onOpenHoldings}
        className="flex min-h-14 items-center justify-between rounded-xl bg-paper px-5 text-left shadow-card transition-transform duration-150 ease-out active:scale-[0.98] md:col-span-2"
      >
        <span className="text-sm font-medium">看全部 {view.visible.length} 筆持倉</span>
        <ChevronRight className="size-5 text-muted" />
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "gain" | "loss";
}) {
  return (
    <div className="rounded-md bg-bg px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-serif text-lg tabular-nums",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </p>
    </div>
  );
}
