import { useEffect, useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatMd,
  formatPct,
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

const BTC_STROKE = "var(--color-ink)";

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
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; name?: string; value?: number; color?: string }[];
  label?: number;
}) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-md bg-paper px-3 py-2 shadow-card">
      <p className="text-xs text-muted">{formatMd(label)}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {payload.map((row) =>
          row.value == null ? null : (
            <li
              key={String(row.dataKey)}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span className="text-muted">{row.name}</span>
              <span className="font-serif tabular-nums">
                {formatTwdNumber(row.value)}
              </span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function TrendChart({ view, usdTwd, owner }: Props) {
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
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const delta = last.totalTwd - first.totalTwd;
    const pct = first.totalTwd > 0 ? delta / first.totalTwd : 0;
    const btcPct =
      first.btcTwd && last.btcTwd && first.btcTwd > 0
        ? (last.btcTwd - first.btcTwd) / first.btcTwd
        : null;
    const beat = btcPct === null ? null : pct - btcPct;
    const values = points.flatMap((p) =>
      [p.totalTwd, p.btcTwd].filter((n): n is number => n != null),
    );
    return {
      first: first.totalTwd,
      last: last.totalTwd,
      delta,
      pct,
      btcPct,
      beat,
      min: Math.min(...values),
      max: Math.max(...values),
      up: delta >= 0,
      hasBtc: btcPct !== null,
    };
  }, [points]);

  const stroke = stats?.up ? "var(--color-gain)" : "var(--color-loss)";
  const fillId = stats?.up ? "trendUp" : "trendDown";
  const fillColor = stats?.up ? "var(--color-gain)" : "var(--color-loss)";
  const yPad = stats ? Math.max(200, (stats.max - stats.min) * 0.08) : 0;

  const verdict =
    stats?.beat == null
      ? null
      : Math.abs(stats.beat) < 0.005
        ? "這段期間跟比特幣差不多"
        : stats.beat > 0
          ? `${owner}比比特幣多 ${formatPct(stats.beat)}`
          : `比特幣比較強，差 ${formatPct(Math.abs(stats.beat))}`;

  return (
    <section className="enter-card span-all rounded-xl bg-paper p-5 shadow-card" style={{ animationDelay: "120ms" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">資產走勢</h2>
          {stats ? (
            <>
              <p
                className={cn(
                  "mt-1 font-serif text-2xl tabular-nums tracking-tight",
                  stats.up ? "text-gain" : "text-loss",
                )}
              >
                {formatSignedTwd(stats.delta)}{" "}
                <span className="text-base">{formatSignedPct(stats.pct)}</span>
              </p>
              {stats.hasBtc ? (
                <p className="mt-1 text-sm text-muted">
                  比特幣 {formatSignedPct(stats.btcPct ?? 0)}
                  {verdict ? ` · ${verdict}` : ""}
                </p>
              ) : null}
            </>
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

      <div className="chart-hit mt-4 h-52">
        {ready && points.length >= 3 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
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
                name={`${owner}的資產`}
                stroke={stroke}
                strokeWidth={2.25}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: stroke,
                  stroke: "var(--color-paper)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="btcTwd"
                name="比特幣"
                stroke={BTC_STROKE}
                strokeWidth={1.75}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{
                  r: 3.5,
                  fill: BTC_STROKE,
                  stroke: "var(--color-paper)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-px w-3/4 bg-line" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded-pill"
            style={{ background: stroke }}
          />
          {owner}的資產
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-4 border-t border-dashed"
            style={{ borderColor: BTC_STROKE }}
          />
          比特幣
        </span>
      </div>

      {stats ? (
        <div className="mt-2 flex justify-between text-xs text-faint">
          <span>
            {formatMd(points[0]!.t)} · {formatTwdNumber(stats.first)}
          </span>
          <span>
            {formatMd(points[points.length - 1]!.t)} · {formatTwdNumber(stats.last)}
          </span>
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-faint">
        兩條線從同一點出發。實線是現在這包資產，虛線是同一筆錢如果全部放比特幣。依現在持有數量回推，不是每天實際買賣的紀錄。
      </p>
    </section>
  );
}
