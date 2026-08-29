import { useEffect, useMemo, useState } from "react";
import {
  Bar,
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
  formatSlot12h,
  formatSlotPart,
  formatTwd,
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

type GapPoint = TrendPoint & { gap: number };

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
        {gap <= 0 ? "已達到目標" : formatGapNumber(gap)}
      </p>
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

  const chart = useMemo<GapPoint[]>(
    () =>
      points.slice(-6).map((p) => ({
        ...p,
        gap: Math.max(0, goal - p.totalTwd),
      })),
    [points, goal],
  );
  const rows = useMemo(() => [...chart].slice(-3).reverse(), [chart]);
  const ceiling = Math.max(...chart.map((p) => p.gap), 1) * 1.18;
  const reached = view.totalTwd >= goal;
  const gapShown = useCountUp(Math.max(0, view.gapTwd), 1000);

  return (
    <div className="mt-5">
      <div>
        <p className="text-sm font-medium text-muted">離目標還有多遠</p>
        <p className="mt-1 font-serif text-3xl tabular-nums tracking-tight">
          {reached ? "已達標" : formatGapNumber(Math.round(gapShown))}
        </p>
        <p className="mt-1 text-xs text-muted">
          {owner}的目標{formatGoalWan(goal)}全賣
          {reached ? "" : " · 柱子愈短愈接近"}
        </p>
      </div>

      <div className="chart-hit mt-4 h-48">
        {ready && chart.length >= 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chart}
              margin={{ top: 8, right: 6, left: 0, bottom: 6 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-line)"
                strokeDasharray="3 6"
              />
              <XAxis
                dataKey="t"
                tick={<SlotTick />}
                tickLine={false}
                axisLine={false}
                interval={0}
                height={32}
              />
              <YAxis
                domain={[0, ceiling]}
                tickFormatter={(v) => axisTwd(Number(v))}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
                ticks={[0, ceiling / 2, ceiling]}
              />
              <Tooltip
                content={<ChartTip goal={goal} />}
                cursor={{ fill: "var(--color-accent-soft)", opacity: 0.45 }}
              />
              <Bar
                dataKey="gap"
                name="還差"
                fill="var(--color-accent)"
                radius={[6, 6, 0, 0]}
                maxBarSize={22}
                isAnimationActive={motion}
                animationDuration={800}
                animationBegin={80}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="gap"
                name="走勢"
                stroke="var(--color-ink)"
                strokeWidth={1.75}
                dot={{ r: 3.5, fill: "var(--color-paper)", stroke: "var(--color-ink)", strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
                isAnimationActive={motion}
                animationDuration={950}
                animationBegin={220}
                animationEasing="ease-out"
              />
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
      <p className="mt-1 text-right text-xs text-faint">近 3 天 · 柱高是還差多少</p>

      {rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((row) => {
            const gap = goal - row.totalTwd;
            return (
              <li key={row.t} className="flex items-center gap-3 py-2.5">
                <span className="w-24 shrink-0 text-sm text-muted">
                  {formatSlot12h(row.t)}
                </span>
                <span className="flex-1 text-right font-serif text-sm tabular-nums">
                  {formatTwdNumber(row.totalTwd)}
                </span>
                <span
                  className={cn(
                    "w-24 shrink-0 text-right text-sm tabular-nums",
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
