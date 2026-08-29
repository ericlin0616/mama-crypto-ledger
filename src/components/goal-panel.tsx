import { useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  formatGoalShort,
  formatPct,
  formatTwd,
  formatTwdNumber,
  formatUsd,
  formatWan,
} from "@/lib/format";
import {
  CORE_SYMBOLS,
  MAJOR_SYMBOLS,
  applyUniformGrowth,
  basketValue,
  btcQuantity,
  growthNeeded,
  type PortfolioView,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  view: PortfolioView;
  goalTwd: number;
  onGoalChange: (value: number) => void;
};

const GOAL_PRESETS = [100_000, 110_000, 120_000, 130_000, 150_000, 200_000];
const BTC_PRESETS = [80_000, 90_000, 100_000, 120_000, 150_000];

export function GoalPanel({ view, goalTwd, onGoalChange }: Props) {
  const neededPct = Math.round(view.neededRatio * 100);
  const [userPct, setUserPct] = useState<number | null>(null);
  const growthPct = userPct ?? Math.max(neededPct, 0);
  const [btcTarget, setBtcTarget] = useState(100_000);
  const [extraTwd, setExtraTwd] = useState(0);
  const [goalDraft, setGoalDraft] = useState(String(goalTwd));
  const [extraDraft, setExtraDraft] = useState("");
  const [growthDraft, setGrowthDraft] = useState("");
  const [btcDraft, setBtcDraft] = useState("");

  const skipSlider = useRef(true);

  useEffect(() => {
    setGoalDraft(String(goalTwd));
  }, [goalTwd]);

  const projectedHoldings = applyUniformGrowth(view.totalTwd, growthPct / 100);
  const projected = projectedHoldings + extraTwd;
  const projectedGap = goalTwd - projected;
  const neededWithExtra =
    view.totalTwd > 0
      ? Math.max(0, goalTwd - extraTwd - view.totalTwd) / view.totalTwd
      : 0;

  const btcValue = basketValue(view, ["BTC"]);
  const majorsValue = basketValue(view, MAJOR_SYMBOLS);
  const coreValue = basketValue(view, CORE_SYMBOLS);

  const paths = useMemo(() => {
    const gap = Math.max(0, view.gapTwd);
    return [
      {
        id: "all",
        title: "全部一起漲",
        ratio: growthNeeded(gap, view.totalTwd),
        blurb: "口袋裡每一種幣都漲同樣的幅度。",
      },
      {
        id: "btc",
        title: "只靠比特幣",
        ratio: growthNeeded(gap, btcValue),
        blurb: "其他幣維持現價，只讓比特幣來補。",
      },
      {
        id: "majors",
        title: "三大幣一起",
        ratio: growthNeeded(gap, majorsValue),
        blurb: "比特幣、以太幣、Solana 一起漲，其餘不動。",
      },
      {
        id: "core",
        title: "前五大一起",
        ratio: growthNeeded(gap, coreValue),
        blurb: "再加上 BNB 與 Sui，壓力會再小一點。",
      },
    ];
  }, [btcValue, coreValue, majorsValue, view.gapTwd, view.totalTwd]);

  const qtyBtc = btcQuantity(view);
  const btcHolding = view.holdings.find(
    (h) => h.priceKey === "BTC" && h.unitPriceUsd,
  );
  const currentBtcUsd = btcHolding?.unitPriceUsd ?? null;
  const btcTwdPx = btcHolding?.unitPriceTwd ?? null;
  const usdTwd =
    currentBtcUsd && btcTwdPx ? btcTwdPx / currentBtcUsd : null;

  const btcScenarioTotal = useMemo(() => {
    if (!usdTwd || qtyBtc <= 0) return null;
    const newBtcValue = qtyBtc * btcTarget * usdTwd;
    return view.totalTwd - btcValue + newBtcValue + extraTwd;
  }, [btcTarget, btcValue, extraTwd, qtyBtc, usdTwd, view.totalTwd]);

  const impliedBtcUsd =
    qtyBtc > 0 && usdTwd
      ? (btcValue + Math.max(0, view.gapTwd - extraTwd)) / qtyBtc / usdTwd
      : null;

  const recoverToCost = view.totalCostTwd;
  const recoverGap = goalTwd - recoverToCost;
  const reached = view.totalTwd >= goalTwd;
  const chips = [neededPct, 20, 40, 50, 80, 100].filter(
    (n, i, arr) => n > 0 && arr.indexOf(n) === i,
  );

  const commitGoal = (raw: string) => {
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 1000) return;
    onGoalChange(Math.round(n));
    setGoalDraft(String(Math.round(n)));
  };

  const commitExtra = (raw: string) => {
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      setExtraTwd(0);
      setExtraDraft("");
      return;
    }
    setExtraTwd(n);
    setExtraDraft(raw);
  };

  const commitGrowth = (raw: string) => {
    const trimmed = raw.trim().replace(/%/g, "");
    if (trimmed === "") {
      setUserPct(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(0, Math.min(300, n));
    setUserPct(clamped);
    setGrowthDraft(String(clamped));
  };

  const commitBtc = (raw: string) => {
    const n = Number(raw.replace(/,/g, "").replace(/\$/g, ""));
    if (!Number.isFinite(n) || n < 1) return;
    setBtcTarget(Math.round(n));
    setBtcDraft(String(Math.round(n)));
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="enter-card rounded-xl bg-paper p-5 shadow-card">
        <p className="text-sm font-medium text-muted">我想達到</p>
        <div className="mt-2 flex items-end gap-2">
          <input
            inputMode="numeric"
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={() => commitGoal(goalDraft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitGoal(goalDraft);
            }}
            aria-label="目標金額"
            className="h-14 min-w-0 flex-1 rounded-md bg-bg px-3 font-serif text-3xl tabular-nums tracking-tight outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
          />
          <span className="mb-3 shrink-0 text-sm text-muted">元</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOAL_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onPointerDown={() => {
                onGoalChange(n);
                setGoalDraft(String(n));
              }}
              onClick={() => {
                onGoalChange(n);
                setGoalDraft(String(n));
              }}
              className={cn(
                "h-11 rounded-pill px-4 text-sm",
                goalTwd === n ? "bg-ink text-paper" : "bg-bg text-muted",
              )}
            >
              {formatGoalShort(n)}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {reached
            ? `已經到 ${formatGoalShort(goalTwd)} 了。可以把目標再往上調。`
            : `現在 ${formatWan(view.totalTwd)}，還差 ${formatWan(view.gapTwd)}。整體再漲 ${formatPct(view.neededRatio)} 就到。`}
        </p>
      </section>

      <section className="rounded-xl bg-paper p-5 shadow-card">
        <h2 className="font-serif text-lg">自己算一次</h2>
        <p className="mt-1 text-sm text-muted">
          填目標、再投入、漲幅，下面會立刻算出來。
        </p>

        <label className="mt-5 block text-sm font-medium" htmlFor="extra">
          現在再投入（台幣）
        </label>
        <input
          id="extra"
          inputMode="numeric"
          placeholder="0"
          value={extraDraft}
          onChange={(e) => commitExtra(e.target.value)}
          className="mt-2 h-12 w-full rounded-md bg-bg px-3 text-base tabular-nums outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
        />

        <div className="mt-5 flex items-end justify-between">
          <label className="text-sm font-medium" htmlFor="growth">
            假設整體再漲
          </label>
          <p className="font-serif text-3xl tabular-nums tracking-tight">
            {growthPct}%
          </p>
        </div>
        <Slider
          className="mt-2"
          value={[growthPct]}
          onValueChange={(v) => {
            if (skipSlider.current) {
              skipSlider.current = false;
              return;
            }
            const n = v[0] ?? 0;
            setUserPct(n);
            setGrowthDraft(String(n));
          }}
          min={0}
          max={200}
          step={1}
          aria-label="全部持倉漲幅"
        />
        <input
          id="growth"
          inputMode="decimal"
          placeholder="也可以自己打，例如 40"
          value={growthDraft}
          onChange={(e) => setGrowthDraft(e.target.value)}
          onBlur={() => commitGrowth(growthDraft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitGrowth(growthDraft);
          }}
          className="mt-3 h-12 w-full rounded-md bg-bg px-3 text-base tabular-nums outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((n) => (
            <button
              key={n}
              type="button"
              onPointerDown={() => {
                setUserPct(n);
                setGrowthDraft(String(n));
              }}
              onClick={() => {
                setUserPct(n);
                setGrowthDraft(String(n));
              }}
              className={cn(
                "h-11 rounded-pill px-4 text-sm",
                growthPct === n ? "bg-ink text-paper" : "bg-bg text-muted",
              )}
            >
              {n}%
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-md bg-bg px-4 py-4">
          <p className="text-xs text-muted">預估總資產</p>
          <p className="mt-1 font-serif text-3xl tabular-nums tracking-tight">
            {formatTwdNumber(projected)}
          </p>
          <p
            className={cn(
              "mt-2 text-sm",
              projectedGap <= 0 ? "text-gain" : "text-muted",
            )}
          >
            {projectedGap <= 0
              ? `到了，還多 ${formatTwd(Math.abs(projectedGap))}`
              : `還差 ${formatTwd(projectedGap)}`}
          </p>
          {extraTwd > 0 ? (
            <p className="mt-2 text-xs text-faint">
              含再投入 {formatTwd(extraTwd)}。持倉本身還要再漲{" "}
              {formatPct(neededWithExtra)} 才夠到目標。
            </p>
          ) : (
            <p className="mt-2 text-xs text-faint">
              不額外投入的話，持倉要再漲 {formatPct(view.neededRatio)}。
            </p>
          )}
        </div>
      </section>

      {!reached ? (
        <section className="flex flex-col gap-3 md:grid md:grid-cols-2">
          <h2 className="px-1 font-serif text-lg md:col-span-2">四條路</h2>
          {paths.map((path, i) => (
            <article key={path.id} className="rounded-xl bg-paper p-5 shadow-card">
              <p className="text-xs font-medium text-faint">路徑 {i + 1}</p>
              <h3 className="mt-1 font-serif text-xl">{path.title}</h3>
              <p className="mt-3 font-serif text-3xl tabular-nums tracking-tight text-accent">
                再漲 {formatPct(path.ratio)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{path.blurb}</p>
              {path.id === "btc" && impliedBtcUsd ? (
                <p className="mt-3 text-sm text-ink">
                  比特幣大約要到 {formatUsd(impliedBtcUsd, 0)}。
                </p>
              ) : null}
              {path.ratio > 1.5 ? (
                <p className="mt-3 text-xs text-loss">只靠這一籃，需要翻倍以上，比較難。</p>
              ) : path.ratio > 0.4 ? (
                <p className="mt-3 text-xs text-muted">要大漲一截才夠。</p>
              ) : (
                <p className="mt-3 text-xs text-gain">幅度相對溫和。</p>
              )}
            </article>
          ))}
        </section>
      ) : null}

      {qtyBtc > 0 && usdTwd ? (
        <section className="rounded-xl bg-paper p-5 shadow-card">
          <h2 className="font-serif text-lg">如果比特幣漲到…</h2>
          <p className="mt-1 text-sm text-muted">
            其他幣先當不變。現在持有約 {qtyBtc.toFixed(4)} 顆。
            {currentBtcUsd ? ` 現價約 ${formatUsd(currentBtcUsd, 0)}。` : ""}
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="mb-3 text-sm text-muted">USD</span>
            <input
              inputMode="numeric"
              value={btcDraft || String(btcTarget)}
              onChange={(e) => setBtcDraft(e.target.value)}
              onBlur={() => commitBtc(btcDraft || String(btcTarget))}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitBtc(btcDraft || String(btcTarget));
              }}
              aria-label="比特幣目標美元價"
              className="h-14 min-w-0 flex-1 rounded-md bg-bg px-3 font-serif text-3xl tabular-nums tracking-tight outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {BTC_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onPointerDown={() => {
                  setBtcTarget(n);
                  setBtcDraft(String(n));
                }}
                onClick={() => {
                  setBtcTarget(n);
                  setBtcDraft(String(n));
                }}
                className={cn(
                  "h-11 rounded-pill px-4 text-sm",
                  btcTarget === n ? "bg-ink text-paper" : "bg-bg text-muted",
                )}
              >
                {formatUsd(n, 0)}
              </button>
            ))}
          </div>
          {btcScenarioTotal !== null ? (
            <div className="mt-5 rounded-md bg-bg px-4 py-4">
              <p className="text-xs text-muted">那時的總資產</p>
              <p className="mt-1 font-serif text-3xl tabular-nums tracking-tight">
                {formatTwdNumber(btcScenarioTotal)}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm",
                  btcScenarioTotal >= goalTwd ? "text-gain" : "text-muted",
                )}
              >
                {btcScenarioTotal >= goalTwd
                  ? `到了，還多 ${formatTwd(btcScenarioTotal - goalTwd)}`
                  : `還差 ${formatTwd(goalTwd - btcScenarioTotal)}`}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {recoverToCost > 0 ? (
        <section className="rounded-xl bg-paper p-5 shadow-card">
          <h2 className="font-serif text-lg">先回到本金？</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            有紀錄的買進成本大約 {formatWan(recoverToCost)}。
            {recoverToCost < goalTwd
              ? ` 就算全部回到當時買進的價錢，也大約只有這個數字，離 ${formatGoalShort(goalTwd)} 還差 ${formatWan(recoverGap)}。要達標，不能只靠「解套」，還需要再漲一截，或之後再投入。`
              : ` 回到本金就已經超過 ${formatGoalShort(goalTwd)}。`}
          </p>
        </section>
      ) : null}

      <section className="rounded-xl bg-paper p-5 shadow-card">
        <h2 className="font-serif text-lg">各幣若要獨自補上缺口</h2>
        <p className="mt-1 text-sm text-muted">其他維持現價時，單一幣種需要漲多少。</p>
        <ul className="mt-4 divide-y divide-line">
          {view.bySymbol.filter((row) => !row.grouped).slice(0, 8).map((row) => {
            const ratio = growthNeeded(Math.max(0, view.gapTwd), row.valueTwd);
            const hard = ratio > 1.5;
            return (
              <li key={row.symbol} className="flex items-baseline justify-between gap-3 py-3">
                <span>
                  <span className="block text-sm">{row.name}</span>
                  <span className="block text-xs text-faint">{formatTwd(row.valueTwd)}</span>
                </span>
                <span className={cn("text-right font-serif text-lg tabular-nums", hard && "text-muted")}>
                  {Number.isFinite(ratio) ? formatPct(ratio) : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
