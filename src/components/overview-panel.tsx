import { useState } from "react";
import { ChevronRight, Plus, Share2 } from "lucide-react";
import { GoalGapChart } from "@/components/goal-gap-chart";
import { TrendChart } from "@/components/trend-chart";
import { Button } from "@/components/ui/button";
import {
  formatGoalShort,
  formatPct,
  formatRelative,
  formatSignedPct,
  formatSignedTwd,
  formatTwd,
  formatTwdNumber,
  formatUsd,
  formatWan,
} from "@/lib/format";
import type { LastVisit } from "@/lib/ledger-store";
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
  owner: string;
  lastVisit: LastVisit | null;
  usdTwd: number | null;
  onOpenGoal: () => void;
  onOpenHoldings: () => void;
  onAddEntry: () => void;
};

function buildSummary(view: PortfolioView, owner: string): string {
  const lines = [
    `${owner}的加密帳本`,
    `現在總資產 ${formatTwd(view.totalTwd)}`,
  ];
  if (view.todayDeltaTwd !== null && view.todayDeltaPct !== null) {
    lines.push(
      `今日約 ${formatSignedTwd(view.todayDeltaTwd)}（${formatSignedPct(view.todayDeltaPct)}）`,
    );
  }
  if (view.totalTwd >= view.goalTwd) {
    lines.push(`已達到目標 ${formatGoalShort(view.goalTwd)}`);
  } else {
    lines.push(
      `目標 ${formatGoalShort(view.goalTwd)}，還差 ${formatTwd(view.gapTwd)}，整體再漲 ${formatPct(view.neededRatio)}`,
    );
  }
  const btc = view.majors.find((m) => m.symbol === "BTC");
  if (btc) {
    lines.push(
      `比特幣 ${formatUsd(btc.usd, 0)}${btc.change24h !== null ? `（${formatSignedPct(btc.change24h)}）` : ""}`,
    );
  }
  return lines.join("\n");
}

export function OverviewPanel({
  view,
  owner,
  lastVisit,
  usdTwd,
  onOpenGoal,
  onOpenHoldings,
  onAddEntry,
}: Props) {
  const [copied, setCopied] = useState(false);

  const goal = view.goalTwd;
  const reached = view.totalTwd >= goal;
  const top = view.bySymbol.slice(0, 5);
  const restValue = view.bySymbol.slice(5).reduce((s, r) => s + r.valueTwd, 0);
  const pieData = [
    ...top.map((row) => ({
      name: row.name,
      value: row.valueTwd,
      grouped: row.grouped,
      valueUsd: row.valueUsd,
    })),
    ...(restValue > 0
      ? [{ name: "其他", value: restValue, grouped: false, valueUsd: null as number | null }]
      : []),
  ];
  const visitDelta =
    lastVisit && lastVisit.totalTwd > 0 && Date.now() - lastVisit.t > 3 * 60_000
      ? view.totalTwd - lastVisit.totalTwd
      : null;

  const share = async () => {
    const text = buildSummary(view, owner);
    try {
      if (navigator.share) {
        await navigator.share({ text, title: `${owner}的加密帳本` });
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("複製下面這段", text);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
      <section className="rounded-xl bg-paper p-5 shadow-card">
        <p className="text-sm font-medium text-muted">目前總資產</p>
        <p className="mt-1 font-serif text-5xl leading-tight tracking-tight tabular-nums">
          {formatTwdNumber(view.totalTwd)}
        </p>

        <GoalGapChart view={view} usdTwd={usdTwd} owner={owner} />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat
            label="完成度"
            value={formatPct(Math.min(view.progress, 9.99), 0)}
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
          <Stat
            label="今日大約"
            value={
              view.todayDeltaTwd === null
                ? "—"
                : formatSignedTwd(view.todayDeltaTwd)
            }
            hint={
              view.todayDeltaPct === null
                ? undefined
                : formatSignedPct(view.todayDeltaPct)
            }
            tone={
              view.todayDeltaTwd === null
                ? "neutral"
                : view.todayDeltaTwd >= 0
                  ? "gain"
                  : "loss"
            }
          />
          <Stat
            label={lastVisit ? `比 ${formatRelative(lastVisit.t)}` : "上次打開"}
            value={
              visitDelta === null ? "—" : formatSignedTwd(visitDelta)
            }
            tone={
              visitDelta === null
                ? "neutral"
                : visitDelta >= 0
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onPointerDown={onOpenGoal} onClick={onOpenGoal}>
            看怎麼到達標
          </Button>
          <Button
            variant="secondary"
            onPointerDown={() => void share()}
            onClick={() => void share()}
          >
            <Share2 className="size-4" />
            {copied ? "已複製" : "傳給家人"}
          </Button>
        </div>
      </section>

      <TrendChart view={view} usdTwd={usdTwd} owner={owner} />

      {view.majors.length > 0 ? (
        <section className="rounded-xl bg-paper p-5 shadow-card">
          <h2 className="font-serif text-lg">現在行情</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {view.majors.map((row) => (
              <li key={row.symbol} className="flex items-baseline justify-between gap-3">
                <span>
                  <span className="block text-sm">{row.name}</span>
                  <span className="block text-xs text-faint">{row.symbol}</span>
                </span>
                <span className="text-right">
                  <span className="block font-serif text-lg tabular-nums">
                    {formatUsd(row.usd, row.usd >= 100 ? 0 : 2)}
                  </span>
                  <span
                    className={cn(
                      "block text-xs tabular-nums",
                      row.change24h === null
                        ? "text-faint"
                        : row.change24h >= 0
                          ? "text-gain"
                          : "text-loss",
                    )}
                  >
                    {row.change24h === null ? "—" : formatSignedPct(row.change24h)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl bg-paper p-5 shadow-card">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-lg">幣種佔比</h2>
          <p className="text-xs text-faint">前五大 + 其他</p>
        </div>
        <ul className="mt-4 flex flex-col gap-4">
          {pieData.map((row, i) => {
            const share = view.totalTwd > 0 ? row.value / view.totalTwd : 0;
            return (
              <li key={row.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 shrink-0 rounded-pill"
                      style={{ background: SLICE_COLORS[i] }}
                    />
                    {row.name}
                  </span>
                  <span className="text-sm tabular-nums">
                    {row.grouped ? `換成 ${formatTwd(row.value)}` : formatTwd(row.value)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line">
                  <div
                    className="h-full rounded-pill transition-[width] duration-500 ease-out"
                    style={{
                      width: `${Math.max(2, share * 100)}%`,
                      background: SLICE_COLORS[i],
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-faint">
                  {formatPct(share)}
                  {row.grouped && row.valueUsd !== null
                    ? ` · 約 ${formatUsd(row.valueUsd, row.valueUsd >= 100 ? 0 : 2)}`
                    : ""}
                </p>
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

      <div className="grid grid-cols-1 gap-2 md:col-span-2 md:grid-cols-2">
        <button
          type="button"
          onPointerDown={onAddEntry}
          onClick={onAddEntry}
          className="flex min-h-14 items-center justify-between rounded-xl bg-paper px-5 text-left shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          <span className="text-sm font-medium">記一筆買進或賣出</span>
          <Plus className="size-5 text-muted" />
        </button>
        <button
          type="button"
          onPointerDown={onOpenHoldings}
          onClick={onOpenHoldings}
          className="flex min-h-14 items-center justify-between rounded-xl bg-paper px-5 text-left shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          <span className="text-sm font-medium">看全部 {view.visible.length} 筆持倉</span>
          <ChevronRight className="size-5 text-muted" />
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
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
      {hint ? (
        <p
          className={cn(
            "mt-0.5 text-xs tabular-nums",
            tone === "gain" && "text-gain",
            tone === "loss" && "text-loss",
            tone === "neutral" && "text-faint",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
