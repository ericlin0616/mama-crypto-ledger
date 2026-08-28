import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  formatPct,
  formatQty,
  formatSignedPct,
  formatTwd,
  formatUsd,
} from "@/lib/format";
import { SOURCES, growthNeeded, type ValuedHolding } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  holding: ValuedHolding | null;
  gapTwd: number;
  goalTwd: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qtyOverride?: number;
  onSaveQty: (id: string, qty: number | null) => void;
  onSaveCost: (id: string, cost: number | null) => void;
  onHide: (id: string) => void;
};

export function HoldingSheet({
  holding,
  gapTwd,
  goalTwd,
  open,
  onOpenChange,
  qtyOverride,
  onSaveQty,
  onSaveCost,
  onHide,
}: Props) {
  const [draft, setDraft] = useState("");
  const [costDraft, setCostDraft] = useState("");

  useEffect(() => {
    if (!holding) return;
    const q = qtyOverride ?? holding.quantity;
    setDraft(q === null || q === undefined ? "" : String(q));
    setCostDraft(holding.costTwd === null ? "" : String(Math.round(holding.costTwd)));
  }, [holding, qtyOverride]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !holding) return null;

  const solo = growthNeeded(Math.max(0, gapTwd), holding.valueTwd);
  const displayQty = qtyOverride ?? holding.quantityUsed;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="關閉"
        className="absolute inset-0 bg-ink/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="holding-title"
        className="relative z-10 mx-auto flex max-h-sheet w-full max-w-lg flex-col rounded-t-xl bg-paper shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-pill bg-line" />
        <div className="overflow-y-auto px-5 pb-10 pt-4">
          <p className="text-xs font-medium text-faint">
            {SOURCES[holding.source].label}
          </p>
          <h2 id="holding-title" className="mt-1 font-serif text-2xl">
            {holding.name}
          </h2>
          <p className="text-sm text-muted">{holding.symbol}</p>

          <p className="mt-5 font-serif text-4xl tabular-nums tracking-tight">
            {formatTwd(holding.valueTwd)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {holding.valueSource === "live" ? "即時市價" : "截圖估值"}
            {holding.change24h !== null
              ? ` · 今日 ${formatSignedPct(holding.change24h)}`
              : ""}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-2">
            <Fact
              label="數量"
              value={displayQty !== null ? formatQty(displayQty) : "—"}
            />
            <Fact
              label="單價"
              value={
                holding.unitPriceUsd
                  ? formatUsd(
                      holding.unitPriceUsd,
                      holding.unitPriceUsd >= 100 ? 0 : 2,
                    )
                  : holding.unitPriceTwd
                    ? formatTwd(
                        holding.unitPriceTwd,
                        holding.unitPriceTwd >= 100 ? 0 : 2,
                      )
                    : "—"
              }
            />
            <Fact
              label="買進成本"
              value={
                holding.costTwd !== null
                  ? formatTwd(holding.costTwd)
                  : "沒有紀錄"
              }
            />
            <Fact
              label="損益"
              value={holding.pnlTwd === null ? "—" : formatTwd(holding.pnlTwd)}
              tone={
                holding.pnlTwd === null
                  ? "neutral"
                  : holding.pnlTwd >= 0
                    ? "gain"
                    : "loss"
              }
            />
          </dl>

          {holding.pnlPct !== null ? (
            <p
              className={cn(
                "mt-3 text-sm tabular-nums",
                holding.pnlPct >= 0 ? "text-gain" : "text-loss",
              )}
            >
              報酬率 {formatSignedPct(holding.pnlPct)}
            </p>
          ) : null}

          {holding.notes ? (
            <p className="mt-3 text-sm text-muted">{holding.notes}</p>
          ) : null}

          {holding.valueTwd > 1 && gapTwd > 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              若只靠這一筆補上缺口，需要再漲 {formatPct(solo)}
              {solo > 2 ? "，幅度很大，不太實際。" : "。"}
              {holding.unitPriceUsd
                ? ` 單價大約要到 ${formatUsd(holding.unitPriceUsd * (1 + solo), holding.unitPriceUsd >= 100 ? 0 : 2)}。`
                : ""}
            </p>
          ) : null}

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(draft);
              if (Number.isFinite(n) && n >= 0) onSaveQty(holding.id, n);
              const c = Number(costDraft);
              if (costDraft.trim() === "") onSaveCost(holding.id, null);
              else if (Number.isFinite(c) && c >= 0) onSaveCost(holding.id, c);
              onOpenChange(false);
            }}
          >
            <label className="text-sm font-medium" htmlFor="qty">
              持有數量
            </label>
            <input
              id="qty"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-2 h-12 w-full rounded-md bg-bg px-3 text-base tabular-nums outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
            />
            <label className="mt-4 block text-sm font-medium" htmlFor="cost">
              買進成本（台幣）
            </label>
            <p className="mt-1 text-xs text-faint">記得成本，損益才會準。</p>
            <input
              id="cost"
              inputMode="numeric"
              value={costDraft}
              onChange={(e) => setCostDraft(e.target.value)}
              placeholder="沒有紀錄可留空"
              className="mt-2 h-12 w-full rounded-md bg-bg px-3 text-base tabular-nums outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
            />
            <div className="mt-3 flex gap-2">
              <Button type="submit" className="flex-1">
                儲存
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  onSaveQty(holding.id, null);
                  onSaveCost(holding.id, null);
                  onOpenChange(false);
                }}
              >
                恢復截圖
              </Button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => {
              onHide(holding.id);
              onOpenChange(false);
            }}
            className="mt-4 w-full py-3 text-sm text-muted"
          >
            這筆先不要顯示
          </button>

          <p className="mt-2 text-xs text-faint">
            目標 {formatTwd(goalTwd)} · 僅供整理持倉，不是投資建議。
          </p>
        </div>
      </div>
    </div>
  );
}

function Fact({
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
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-sm tabular-nums",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
