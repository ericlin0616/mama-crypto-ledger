import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatMd,
  formatSignedPct,
  formatSignedTwd,
  formatTwdNumber,
} from "@/lib/format";
import { buildTrend, type TrendPoint, type TrendRange } from "@/lib/trend";
import type { PortfolioView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const RANGES: { id: TrendRange; label: string }[] = [
  { id: "7d", label: "7 天" },
  { id: "30d", label: "30 天" },
  { id: "90d", label: "90 天" },
];

type Props = {
  view: PortfolioView;
  usdTwd: number | null;
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
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
}) {
  if (!active || !payload?.[0] || !label) return null;
  return (
    <div className="rounded-md bg-paper px-3 py-2 shadow-card">
      <p className="text-xs text-muted">{formatMd(label)}</p>
      <p className="font-serif text-lg tabular-nums tracking-tight">
        {formatTwdNumber(payload[0].value)}
      </p>
    </div>
  );
}

export function TrendChart({ view, usdTwd }: Props) {
  const [range, setRange] = useState<TrendRange>("30d");
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!usdTwd || view.totalTwd < 1) return;
    let cancelled = false;
    setStatus("loading");
    void buildTrend(view, range, usdTwd)
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
  }, [range, usdTwd, view.totalTwd, view.visible.length]);

  const stats = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0]!.totalTwd;
    const last = points[points.length - 1]!.totalTwd;
    const delta = last - first;
    const pct = first > 0 ? delta / first : 0;
    const values = points.map((p) => p.totalTwd);
    return {
      first,
      last,
      delta,
      pct,
      min: Math.min(...values),
      max: Math.max(...values),
      up: delta >= 0,
    };
  }, [points]);

  const stroke = stats?.up ? "var(--color-gain)" : "var(--color-loss)";
  const fillId = stats?.up ? "trendUp" : "trendDown";
  const fillColor = stats?.up ? "var(--color-gain)" : "var(--color-loss)";
  const yPad = stats
    ? Math.max(200, (stats.max - stats.min) * 0.08)
    : 0;

  return (
    <section className="span-all rounded-xl bg-paper p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">資產走勢</h2>
          {stats ? (
            <p
              className={cn(
                "mt-1 font-serif text-2xl tabular-nums tracking-tight",
                stats.up ? "text-gain" : "text-loss",
              )}
            >
              {formatSignedTwd(stats.delta)}{" "}
              <span className="text-base">{formatSignedPct(stats.pct)}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {status === "error" ? "走勢暫時抓不到" : "正在畫這段時間…"}
            </p>
          )}
        </div>
        <div className="flex rounded-md bg-bg p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onPointerDown={() => setRange(r.id)}
              onClick={() => setRange(r.id)}
              className={cn(
                "h-10 rounded-sm px-3 text-xs font-medium",
                range === r.id ? "bg-paper text-ink shadow-card" : "text-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-hit mt-4 h-48">
        {ready && points.length >= 3 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                tickFormatter={(v) => formatMd(Number(v))}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={48}
              />
              <YAxis
                domain={
                  stats
                    ? [stats.min - yPad, stats.max + yPad]
                    : ["auto", "auto"]
                }
                tickFormatter={(v) => axisTwd(Number(v))}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                content={<ChartTip />}
                cursor={{ stroke: "var(--color-line)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="totalTwd"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, fill: stroke, stroke: "var(--color-paper)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-px w-3/4 bg-line" />
          </div>
        )}
      </div>

      {stats ? (
        <div className="mt-3 flex justify-between text-xs text-faint">
          <span>
            {formatMd(points[0]!.t)} · {formatTwdNumber(stats.first)}
          </span>
          <span>
            {formatMd(points[points.length - 1]!.t)} · {formatTwdNumber(stats.last)}
          </span>
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-faint">
        依現在持有的數量，用當時市價回推。不是每天實際買賣的紀錄。點圖上可以看到那一天大概值多少。
      </p>
    </section>
  );
}
