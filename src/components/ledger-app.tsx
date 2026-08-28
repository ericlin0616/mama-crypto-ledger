import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, RefreshCw, Target, Wallet } from "lucide-react";
import { AddEntrySheet } from "@/components/add-entry-sheet";
import { GoalPanel } from "@/components/goal-panel";
import { HoldingSheet } from "@/components/holding-sheet";
import { HoldingsPanel } from "@/components/holdings-panel";
import { OverviewPanel } from "@/components/overview-panel";
import { usePrices } from "@/hooks/use-prices";
import { formatTime } from "@/lib/format";
import {
  applyTrade,
  loadCost,
  loadCustom,
  loadGoal,
  loadHidden,
  loadHistory,
  loadLastVisit,
  loadQty,
  recordHistory,
  saveCost,
  saveCustom,
  saveGoal,
  saveHidden,
  saveLastVisit,
  saveQty,
  type HistoryPoint,
  type LastVisit,
} from "@/lib/ledger-store";
import { GOAL_TWD, HOLDINGS, buildPortfolio, type Holding } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Tab = "home" | "holdings" | "goal";

export function LedgerApp() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cost, setCost] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState<Holding[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [goalTwd, setGoalTwd] = useState(GOAL_TWD);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [lastVisit, setLastVisit] = useState<LastVisit | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<Tab>("home");

  const extraSymbols = useMemo(
    () => custom.map((h) => h.symbol),
    [custom],
  );
  const { book, status, refresh } = usePrices(extraSymbols);

  useEffect(() => {
    setQty(loadQty());
    setCost(loadCost());
    setCustom(loadCustom());
    setHidden(loadHidden());
    setGoalTwd(loadGoal(GOAL_TWD));
    setHistory(loadHistory());
    setLastVisit(loadLastVisit());
  }, []);

  const view = useMemo(
    () =>
      buildPortfolio(book, qty, goalTwd, {
        custom,
        costOverrides: cost,
        hiddenIds: hidden,
      }),
    [book, qty, goalTwd, custom, cost, hidden],
  );
  const selected = view.holdings.find((h) => h.id === selectedId) ?? null;
  const live = status === "live";

  useEffect(() => {
    if (view.totalTwd < 1) return;
    const id = window.setTimeout(() => {
      setHistory(recordHistory(view.totalTwd));
      saveLastVisit(view.totalTwd);
    }, 8000);
    return () => window.clearTimeout(id);
  }, [view.totalTwd]);

  const persistQty = (next: Record<string, number>) => {
    setQty(next);
    saveQty(next);
  };
  const persistCost = (next: Record<string, number>) => {
    setCost(next);
    saveCost(next);
  };

  const saveQtyOne = (id: string, next: number | null) => {
    const copy = { ...qty };
    if (next === null) delete copy[id];
    else copy[id] = next;
    persistQty(copy);
  };

  const saveCostOne = (id: string, next: number | null) => {
    const copy = { ...cost };
    if (next === null) delete copy[id];
    else copy[id] = next;
    persistCost(copy);
    if (id.startsWith("custom-")) {
      const updated = custom.map((h) =>
        h.id === id ? { ...h, costTwd: next } : h,
      );
      setCustom(updated);
      saveCustom(updated);
    }
  };

  const hideOne = (id: string) => {
    const next = hidden.includes(id) ? hidden : [...hidden, id];
    setHidden(next);
    saveHidden(next);
  };

  return (
    <div className="relative min-h-dvh bg-bg text-ink">
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col md:max-w-4xl">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-bg px-5 pb-3 pt-safe md:px-8">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl leading-tight">媽媽的加密帳本</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
              {live ? (
                <span className="inline-flex items-center gap-1 text-gain">
                  <span className="size-1.5 rounded-pill bg-gain" />
                  即時 {book ? formatTime(book.fetchedAt) : ""} 更新
                </span>
              ) : status === "loading" ? (
                "正在更新市價…"
              ) : status === "error" ? (
                "市價暫時連不上，顯示截圖估值"
              ) : (
                "目前顯示截圖當時的估值"
              )}
            </p>
          </div>
          <button
            type="button"
            onPointerDown={() => void refresh()}
            onClick={() => void refresh()}
            aria-label="更新市價"
            className="flex size-11 items-center justify-center rounded-md bg-paper text-ink shadow-card transition-transform duration-150 ease-out active:scale-95"
          >
            <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
          </button>
        </header>

        <main className="flex-1 px-5 pb-28 md:px-8">
          {tab === "home" ? (
            <OverviewPanel
              view={view}
              live={live}
              lastVisit={lastVisit}
              history={history}
              onOpenGoal={() => setTab("goal")}
              onOpenHoldings={() => setTab("holdings")}
              onAddEntry={() => setAdding(true)}
            />
          ) : null}
          {tab === "holdings" ? (
            <HoldingsPanel
              view={view}
              onSelect={(id) => setSelectedId(id)}
              onAddEntry={() => setAdding(true)}
            />
          ) : null}
          {tab === "goal" ? (
            <GoalPanel
              view={view}
              goalTwd={goalTwd}
              onGoalChange={(value) => {
                setGoalTwd(value);
                saveGoal(value);
              }}
            />
          ) : null}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper pb-safe">
        <div className="mx-auto grid max-w-lg grid-cols-3 md:max-w-4xl">
          <TabBtn
            active={tab === "home"}
            onClick={() => setTab("home")}
            icon={<BookOpen className="size-5" />}
            label="總覽"
          />
          <TabBtn
            active={tab === "holdings"}
            onClick={() => setTab("holdings")}
            icon={<Wallet className="size-5" />}
            label="持倉"
          />
          <TabBtn
            active={tab === "goal"}
            onClick={() => setTab("goal")}
            icon={<Target className="size-5" />}
            label="達標"
          />
        </div>
      </nav>

      <HoldingSheet
        holding={selected}
        gapTwd={view.gapTwd}
        goalTwd={goalTwd}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        qtyOverride={selectedId ? qty[selectedId] : undefined}
        onSaveQty={saveQtyOne}
        onSaveCost={saveCostOne}
        onHide={hideOne}
      />

      <AddEntrySheet
        open={adding}
        onOpenChange={setAdding}
        onSubmit={(entry) => {
          const next = applyTrade({
            holdings: HOLDINGS,
            custom,
            qty,
            cost,
            hidden,
            entry,
          });
          persistQty(next.qty);
          persistCost(next.cost);
          setCustom(next.custom);
          saveCustom(next.custom);
          setHidden(next.hidden);
          saveHidden(next.hidden);
          setTab("holdings");
        }}
      />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={onClick}
      onClick={onClick}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150",
        active ? "text-accent" : "text-faint",
      )}
    >
      {icon}
      <span className={cn(active && "font-medium")}>{label}</span>
    </button>
  );
}
