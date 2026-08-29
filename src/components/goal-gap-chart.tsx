import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatGoalWan,
  formatMd,
  formatSlot12h,
  formatTwd,
  formatTwdNumber,
  formatWan,
} from "@/lib/format";
import { buildTrend, type TrendPoint } from "@/lib/trend";
import type { PortfolioView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  view: PortfolioView;
  usdTwd: number | null;
  owner: string;
};

function axisTwd(value: number): string {
  if (Math.abs(value) >= 10_000) {
    const wan = value / 10_000;
    return `${wan.toFixed(wan >= 10 ? 0 : 1).replace(/\.0$/, "")}萬`;
  }
  return formatTwdNumber(value, 0);
}

function ChartTip({
  active,
  payload,
  goal,
}: {
  active?: boolean;
  payload?: { payload?: TrendPoint }[];
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
        {gap <= 0 ? "已達到目標" : `還差 ${formatWan(gap)}`}
      </p>
    </div>
  );
}

export function GoalGapChart({ view, usdTwd, owner }: Props) {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [ready, setReady] = useState(false);
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

  const rows = useMemo(() => {
    return [...points].slice(-3).reverse();
  }, [points]);
  const bars = useMemo(() => points.slice(-3), [points]);

  const ceiling = Math.max(goal, ...bars.map((p) => p.totalTwd), 1) * 1.04;
  const reached = view.totalTwd >= goal;

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">離目標還有多遠</p>
          <p className="mt-1 font-serif text-3xl tabular-nums tracking-tight">
            {reached ? "已達標" : formatTwd(view.gapTwd)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {owner}的目標{formatGoalWan(goal)}全賣
            {reached ? "" : ` · 每 12 小時看一次`}
          </p>
        </div>
      </div>

      <div className="chart-hit mt-4 h-40">
        {ready && bars.length >= 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bars}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="t"
                tickFormatter={(v) => formatMd(Number(v))}
                tick={{ fill: "var(--color-faint)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={36}
                interval={0}
              />
              <YAxis
                domain={[0, ceiling]}
                tickFormatter={(v) => axisTwd(Number(v))}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTip goal={goal} />}
                cursor={{ fill: "var(--color-accent-soft)" }}
              />
              <ReferenceLine
                y={goal}
                stroke="var(--color-ink)"
                strokeDasharray="4 4"
                strokeWidth={1.25}
              />
              <Bar
                dataKey="totalTwd"
                name="總資產"
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted">
              {status === "error" ? "這段走勢暫時抓不到" : "正在排每 12 小時…"}
            </p>
          </div>
        )}
      </div>
      <p className="mt-1 text-right text-xs text-faint">虛線是目標 {formatGoalWan(goal)}</p>

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
                  {gap <= 0 ? "已達標" : `還差 ${formatGoalWan(gap)}`}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
