import { formatMd, formatTwdNumber } from "@/lib/format";
import type { HistoryPoint } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";

type Props = {
  points: HistoryPoint[];
};

export function Sparkline({ points }: Props) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.totalTwd);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const w = 280;
  const h = 64;
  const pad = 4;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p.totalTwd - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const up = values[values.length - 1]! >= values[0]!;

  return (
    <section className="rounded-xl bg-paper p-5 shadow-card">
      <div className="flex items-end justify-between">
        <h2 className="font-serif text-lg">這幾天</h2>
        <p className={cn("text-xs tabular-nums", up ? "text-gain" : "text-loss")}>
          {formatTwdNumber(min)} – {formatTwdNumber(max)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-3 h-16 w-full"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={up ? "var(--color-gain)" : "var(--color-loss)"}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={coords.join(" ")}
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-faint">
        <span>{formatMd(points[0]!.t)}</span>
        <span>{formatMd(points[points.length - 1]!.t)}</span>
      </div>
    </section>
  );
}
