import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SYMBOL_META, type SourceId } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const QUICK = ["BTC", "ETH", "SOL", "BNB", "SUI", "DOGE", "XRP"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: {
    symbol: string;
    quantity: number;
    spentTwd: number | null;
    source: SourceId;
    side: "buy" | "sell";
  }) => void;
};

export function AddEntrySheet({ open, onOpenChange, onSubmit }: Props) {
  const [symbol, setSymbol] = useState("BTC");
  const [custom, setCustom] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("");
  const [spent, setSpent] = useState("");
  const [source, setSource] = useState<SourceId>("binance-spot");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const resolved = (custom.trim() || symbol).toUpperCase();
  const name = SYMBOL_META[resolved]?.name ?? resolved;

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
        aria-labelledby="entry-title"
        className="relative z-10 mx-auto flex max-h-sheet w-full max-w-lg flex-col rounded-t-xl bg-paper shadow-card"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-pill bg-line" />
        <form
          className="overflow-y-auto px-5 pb-10 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(qty);
            if (!resolved || !Number.isFinite(n) || n <= 0) return;
            const cash = Number(spent);
            onSubmit({
              symbol: resolved,
              quantity: n,
              spentTwd: Number.isFinite(cash) && cash > 0 ? cash : null,
              source,
              side,
            });
            setQty("");
            setSpent("");
            onOpenChange(false);
          }}
        >
          <h2 id="entry-title" className="font-serif text-2xl">
            記一筆
          </h2>
          <p className="mt-1 text-sm text-muted">買進或賣出後記下來，總資產會重算。</p>

          <p className="mt-5 text-sm font-medium">幣種</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSymbol(s);
                  setCustom("");
                }}
                className={cn(
                  "h-11 rounded-pill px-4 text-sm",
                  resolved === s ? "bg-ink text-paper" : "bg-bg text-muted",
                )}
              >
                {SYMBOL_META[s]?.name ?? s}
              </button>
            ))}
          </div>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.toUpperCase())}
            placeholder="其他代號，例如 PEPE"
            className="mt-3 h-12 w-full rounded-md bg-bg px-3 text-base outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
          />

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide("buy")}
              className={cn(
                "h-12 rounded-md text-sm font-medium",
                side === "buy" ? "bg-gain text-paper" : "bg-bg text-muted",
              )}
            >
              買進
            </button>
            <button
              type="button"
              onClick={() => setSide("sell")}
              className={cn(
                "h-12 rounded-md text-sm font-medium",
                side === "sell" ? "bg-loss text-paper" : "bg-bg text-muted",
              )}
            >
              賣出
            </button>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="entry-qty">
            {name} 數量
          </label>
          <input
            id="entry-qty"
            inputMode="decimal"
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="mt-2 h-12 w-full rounded-md bg-bg px-3 text-base tabular-nums outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
          />

          <label className="mt-5 block text-sm font-medium" htmlFor="entry-spent">
            {side === "buy" ? "花了多少台幣（選填）" : "拿回多少台幣（選填）"}
          </label>
          <input
            id="entry-spent"
            inputMode="numeric"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            placeholder="有填才會更新成本"
            className="mt-2 h-12 w-full rounded-md bg-bg px-3 text-base tabular-nums outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
          />

          <label className="mt-5 block text-sm font-medium" htmlFor="entry-source">
            放在哪裡
          </label>
          <select
            id="entry-source"
            value={source}
            onChange={(e) => setSource(e.target.value as SourceId)}
            className="mt-2 h-12 w-full rounded-md bg-bg px-3 text-base outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
          >
            <option value="binance-spot">Binance 現貨</option>
            <option value="unknown-ex">其他交易所</option>
            <option value="binance-web3">Binance 錢包</option>
            <option value="okx-web3">OKX 錢包</option>
            <option value="bitget">Bitget 錢包</option>
          </select>

          <Button type="submit" className="mt-6 w-full">
            {side === "buy" ? "記下買進" : "記下賣出"}
          </Button>
        </form>
      </div>
    </div>
  );
}
