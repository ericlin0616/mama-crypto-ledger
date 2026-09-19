import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatGapNumber,
  formatGoalWan,
  formatMd,
  formatSignedTwd,
  formatSlot12h,
  formatSlotPart,
  formatTwdNumber,
} from "@/lib/format";
import { useCountUp, useMotion } from "@/hooks/use-count-up";
import { buildTrend, type TrendPoint } from "@/lib/trend";
import type { PortfolioView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  view: PortfolioView;
  usdTwd: number | null;
  owner: string;
};

type GapPoint = TrendPoint & { gap: number; delta: number | null };

function axisTwd(value: number): string {
  if (Math.abs(value) >= 10_000) {
    const wan = value / 10_000;
    return `${wan.toFixed(wan >= 10 ? 0 : 1).replace(/\.0$/, "")}萬`;
  }
  return formatTwdNumber(value, 0);
}

function SlotTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
}) {
  if (!payload) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="var(--color-faint)" fontSize={10}>
        <tspan x="0" dy="12">
          {formatMd(payload.value)}
        </tspan>
        <tspan x="0" dy="12">
          {formatSlotPart(payload.value)}
        </tspan>
      </text>
    </g>
  );
}

function ChartTip({
  active,
  payload,
  goal,
}: {
  active?: boolean;
  payload?: { payload?: GapPoint }[];
  goal: number;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const gap = goal - point.totalTwd;
  return (
    <div className="rounded-md bg-paper px-3 py-2 shadow-card">
      <p className="text-xs text-muted">{formatSlot12h(point.t)}</p>
      <p className="font-serif text-lg tabular-nums tracking-tight">
        {formatTwdNumber(point.totalTwd)}
      </p>
      <p className="text-xs text-muted">
        {gap <= 0 ? "已達到目標" : `還差 ${formatTwdNumber(Math.round(gap))}`}
      </p>
      {point.delta !== null ? (
        <p
          className={cn(
            "text-xs tabular-nums",
            point.delta >= 0 ? "text-gain" : "text-loss",
          )}
        >
          比上一格 {formatSignedTwd(point.delta)}
        </p>
      ) : null}
      {point.btcTwd !== null ? (
        <p className="text-xs text-faint">
          同期比特幣 {formatTwdNumber(point.btcTwd)}
        </p>
      ) : null}
    </div>
  );
}

export function GoalGapChart({ view, usdTwd, owner }: Props) {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [ready, setReady] = useState(false);
  const motion = useMotion();
  const goal = view.goalTwd;

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!usdTwd || view.totalTwd < 1) return;
    let cancelled = false;
    setStatus("loading");
    void buildTrend(view, "12h", usdTwd)
      .then((next) => {
        if (cancelled) return;
        setPoints(next);
        setStatus(next.length >= 3 ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [usdTwd, view.totalTwd, view.visible.length, view.goalTwd]);

  const chart = useMemo<GapPoint[]>(() => {
    const sliced = points.slice(-12);
    return sliced.map((p, i) => {
      const prev = i > 0 ? sliced[i - 1] : null;
      return {
        ...p,
        gap: Math.max(0, goal - p.totalTwd),
        delta: prev ? p.totalTwd - prev.totalTwd : null,
      };
    });
  }, [points, goal]);
  const rows = useMemo(() => [...chart].slice(-6).reverse(), [chart]);
  const values = chart.flatMap((p) =>
    [p.totalTwd, p.btcTwd].filter((n): n is number => n != null && n > 0),
  );
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 1;
  const pad = Math.max((hi - lo) * 0.12, hi * 0.015, 1000);
  const reached = view.totalTwd >= goal;
  const gapShown = useCountUp(Math.max(0, view.gapTwd), 1000);
  const hasBtc = chart.some((p) => p.btcTwd != null);

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div>
        <p className="text-sm font-medium text-muted">離目標還有多遠</p>
        <p className="mt-1 font-serif text-3xl tabular-nums tracking-tight">
          {reached ? "已達標" : `-${formatTwdNumber(Math.round(gapShown))}`}
        </p>
        <p className="mt-1 text-xs text-muted">
          {owner}的目標{formatGoalWan(goal)}全賣
          {reached ? "" : " · 每 12 小時一格，線往上是資產變多"}
        </p>
      </div>

      <div className="chart-hit mt-4 h-60">
        {ready && chart.length >= 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chart}
              margin={{ top: 10, right: 8, left: 0, bottom: 6 }}
            >
              <defs>
                <linearGradient id="familyGapFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical
                horizontal
                stroke="var(--color-line)"
                strokeDasharray="3 6"
              />
              <XAxis
                dataKey="t"
                tick={<SlotTick />}
                tickLine={false}
                axisLine={false}
                interval={chart.length > 8 ? 1 : 0}
                height={32}
              />
              <YAxis
                domain={[Math.max(0, lo - pad), hi + pad]}
                tickFormatter={(v) => axisTwd(Number(v))}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                content={<ChartTip goal={goal} />}
                cursor={{ stroke: "var(--color-accent)", strokeWidth: 1.25 }}
              />
              <Area
                type="monotone"
                dataKey="totalTwd"
                name="資產"
                stroke="none"
                fill="url(#familyGapFill)"
                isAnimationActive={motion}
                animationDuration={800}
                animationBegin={40}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="totalTwd"
                name="資產"
                stroke="var(--color-accent)"
                strokeWidth={2.25}
                dot={{
                  r: 3,
                  fill: "var(--color-paper)",
                  stroke: "var(--color-accent)",
                  strokeWidth: 1.6,
                }}
                activeDot={{ r: 5, fill: "var(--color-accent)" }}
                isAnimationActive={motion}
                animationDuration={950}
                animationBegin={80}
                animationEasing="ease-out"
              />
              {hasBtc ? (
                <Line
                  type="monotone"
                  dataKey="btcTwd"
                  name="比特幣"
                  stroke="var(--color-ink)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={motion}
                  animationDuration={950}
                  animationBegin={180}
                  animationEasing="ease-out"
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted">
              {status === "error" ? "這段走勢暫時抓不到" : "正在排每 12 小時…"}
            </p>
          </div>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-faint">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-accent" />
            資產
          </span>
          {hasBtc ? (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-px w-3 border-t border-dashed border-ink" />
              比特幣
            </span>
          ) : null}
        </span>
        <span>近 {chart.length} 格 · 每 12 小時</span>
      </div>

      {rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((row) => {
            const gap = goal - row.totalTwd;
            return (
              <li key={row.t} className="flex items-center gap-2 py-2.5">
                <span className="w-[4.5rem] shrink-0 text-sm text-muted">
                  {formatSlot12h(row.t)}
                </span>
                <span className="flex-1 text-right font-serif text-sm tabular-nums">
                  {formatTwdNumber(row.totalTwd)}
                </span>
                <span
                  className={cn(
                    "w-16 shrink-0 text-right text-xs tabular-nums",
                    row.delta === null
                      ? "text-faint"
                      : row.delta >= 0
                        ? "text-gain"
                        : "text-loss",
                  )}
                >
                  {row.delta === null ? "—" : formatSignedTwd(row.delta)}
                </span>
                <span
                  className={cn(
                    "w-[4.75rem] shrink-0 text-right text-sm tabular-nums",
                    gap <= 0 ? "text-gain" : "text-muted",
                  )}
                >
                  {gap <= 0 ? "已達標" : formatGapNumber(gap)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
