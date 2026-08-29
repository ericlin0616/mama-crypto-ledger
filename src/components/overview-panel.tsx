import { useState } from "react";
import { Share2 } from "lucide-react";
import { CoinMark } from "@/components/coin-mark";
import { GoalGapChart } from "@/components/goal-gap-chart";
import { TrendChart } from "@/components/trend-chart";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";
import {
  formatGapNumber,
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
import { SOURCES, isStableSymbol, type PortfolioView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  view: PortfolioView;
  owner: string;
  lastVisit: LastVisit | null;
  usdTwd: number | null;
  onOpenGoal: () => void;
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
}: Props) {
  const [copied, setCopied] = useState(false);

  const goal = view.goalTwd;
  const reached = view.totalTwd >= goal;
  const cash = view.bySymbol.find((row) => row.grouped);
  const cashTwd = cash?.valueTwd ?? 0;
  const coinTwd = Math.max(0, view.totalTwd - cashTwd);
  const visitDelta =
    lastVisit && lastVisit.totalTwd > 0 && Date.now() - lastVisit.t > 3 * 60_000
      ? view.totalTwd - lastVisit.totalTwd
      : null;

  const mover = view.visible
    .filter(
      (h) =>
        !isStableSymbol(h.symbol) &&
        h.change24h !== null &&
        h.valueTwd >= 1,
    )
    .map((h) => ({
      name: h.name,
      change: h.change24h ?? 0,
      impact: h.valueTwd - h.valueTwd / (1 + (h.change24h ?? 0)),
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];

  const totalShown = useCountUp(view.totalTwd, 1100);
  const pnlShown = useCountUp(view.totalPnlTwd ?? 0, 900);
  const todayShown = useCountUp(view.todayDeltaTwd ?? 0, 800);
  const visitShown = useCountUp(visitDelta ?? 0, 800);
  const progressShown = useCountUp(Math.min(view.progress, 9.99) * 100, 900);
  const cashShown = useCountUp(cashTwd, 900);
  const coinShown = useCountUp(coinTwd, 900);

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
      <section className="enter-card rounded-xl bg-paper p-5 shadow-card">
        <p className="text-sm font-medium text-muted">目前總資產</p>
        <p className="mt-1 font-serif text-5xl leading-tight tracking-tight tabular-nums">
          {formatTwdNumber(Math.round(totalShown))}
        </p>
        <p className="mt-1 text-xs text-faint">
          台幣
          {usdTwd ? ` · 1 美元 = ${formatTwd(usdTwd)}` : ""}
        </p>

        <GoalGapChart view={view} usdTwd={usdTwd} owner={owner} />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat
            label="完成度"
            value={`${Math.round(progressShown)}%`}
          />
          <Stat
            label={view.totalPnlTwd !== null && view.totalPnlTwd >= 0 ? "估算獲利" : "估算虧損"}
            value={
              view.totalPnlTwd === null
                ? "—"
                : formatTwd(Math.abs(Math.round(pnlShown)))
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
                : formatSignedTwd(Math.round(todayShown))
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
              visitDelta === null ? "—" : formatSignedTwd(Math.round(visitShown))
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
            : `現在大約 ${formatWan(view.totalTwd)}。想到 ${formatGoalShort(goal)}，${formatGapNumber(view.gapTwd)}，相當於整體再漲 ${formatPct(view.neededRatio)}。`}
          {mover
            ? ` 今天影響最大的是${mover.name}，帳上大約 ${formatSignedTwd(mover.impact)}。`
            : ""}
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

      <section
        className="enter-card rounded-xl bg-paper p-5 shadow-card"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="font-serif text-lg">錢放哪一種</h2>
        <ul className="mt-4 flex flex-col gap-4">
          <li>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <CoinMark symbol="STABLE" name="穩定幣" className="size-5 ring-0" />
                穩定幣（等同美金）
              </span>
              <span className="text-sm tabular-nums">換成 {formatTwd(Math.round(cashShown))}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line">
              <div
                className="h-full rounded-pill bg-accent transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max(2, view.totalTwd > 0 ? (cashShown / Math.max(view.totalTwd, 1)) * 100 : 0)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-faint">
              {view.totalTwd > 0 ? formatPct(cashTwd / view.totalTwd) : "—"}
              {cash?.valueUsd
                ? ` · 約 ${formatUsd(cash.valueUsd, cash.valueUsd >= 100 ? 0 : 2)}`
                : ""}
            </p>
          </li>
          <li>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm">其他幣</span>
              <span className="text-sm tabular-nums">{formatTwd(Math.round(coinShown))}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line">
              <div
                className="h-full rounded-pill bg-ink transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max(2, view.totalTwd > 0 ? (coinShown / Math.max(view.totalTwd, 1)) * 100 : 0)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-faint">
              {view.totalTwd > 0 ? formatPct(coinTwd / view.totalTwd) : "—"}
            </p>
          </li>
        </ul>
        {view.investedTwd > 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            當初總投入 {formatTwd(view.investedTwd)}
            {view.totalPnlTwd !== null
              ? `，現在${view.totalPnlTwd >= 0 ? "多" : "少"}了 ${formatTwd(Math.abs(view.totalPnlTwd))}。`
              : "。"}
          </p>
        ) : null}
      </section>

      <TrendChart view={view} usdTwd={usdTwd} owner={owner} />

      {view.majors.length > 0 ? (
        <section
        className="enter-card rounded-xl bg-paper p-5 shadow-card"
        style={{ animationDelay: "160ms" }}
      >
          <h2 className="font-serif text-lg">現在行情</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {view.majors.map((row) => (
              <li key={row.symbol} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <CoinMark symbol={row.symbol} name={row.name} className="size-9" />
                  <span>
                    <span className="block text-sm">{row.name}</span>
                    <span className="block text-xs text-faint">{row.symbol}</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-serif text-lg tabular-nums">
                    {formatUsd(row.usd, row.usd >= 100 ? 0 : 2)}
                  </span>
                  <span className="block text-xs tabular-nums text-faint">
                    換成 {formatTwd(row.twd)}
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

      <section
        className="enter-card rounded-xl bg-paper p-5 shadow-card"
        style={{ animationDelay: "220ms" }}
      >
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
