import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, RefreshCw, Target, Wallet } from "lucide-react";
import { GoalPanel } from "@/components/goal-panel";
import { HoldingSheet } from "@/components/holding-sheet";
import { HoldingsPanel } from "@/components/holdings-panel";
import { OverviewPanel } from "@/components/overview-panel";
import { usePrices } from "@/hooks/use-prices";
import { formatTime } from "@/lib/format";
import { GOAL_TWD, buildPortfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Tab = "home" | "holdings" | "goal";

const QTY_KEY = "mama-ledger-qty-v1";
const GOAL_KEY = "mama-ledger-goal-v1";

function loadQty(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(QTY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadGoal(): number {
  if (typeof window === "undefined") return GOAL_TWD;
  try {
    const raw = window.localStorage.getItem(GOAL_KEY);
    const n = raw ? Number(raw) : GOAL_TWD;
    return Number.isFinite(n) && n >= 1000 ? n : GOAL_TWD;
  } catch {
    return GOAL_TWD;
  }
}

export function LedgerApp() {
  const { book, status, refresh } = usePrices();
  const [tab, setTab] = useState<Tab>("home");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [goalTwd, setGoalTwd] = useState(GOAL_TWD);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setQty(loadQty());
    setGoalTwd(loadGoal());
  }, []);

  const view = useMemo(
    () => buildPortfolio(book, qty, goalTwd),
    [book, qty, goalTwd],
  );
  const selected = view.holdings.find((h) => h.id === selectedId) ?? null;
  const live = status === "live";

  const saveQty = (id: string, next: number | null) => {
    setQty((prev) => {
      const copy = { ...prev };
      if (next === null) delete copy[id];
      else copy[id] = next;
      window.localStorage.setItem(QTY_KEY, JSON.stringify(copy));
      return copy;
    });
  };

  const saveGoal = (value: number) => {
    setGoalTwd(value);
    window.localStorage.setItem(GOAL_KEY, String(value));
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
              onOpenGoal={() => setTab("goal")}
              onOpenHoldings={() => setTab("holdings")}
            />
          ) : null}
          {tab === "holdings" ? (
            <HoldingsPanel
              view={view}
              onSelect={(id) => setSelectedId(id)}
            />
          ) : null}
          {tab === "goal" ? (
            <GoalPanel
              view={view}
              goalTwd={goalTwd}
              onGoalChange={saveGoal}
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
        onSaveQty={saveQty}
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
