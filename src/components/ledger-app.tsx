import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, RefreshCw, Swords, Target, Wallet } from "lucide-react";
import { AddEntrySheet } from "@/components/add-entry-sheet";
import { BattlePanel } from "@/components/battle-panel";
import { GoalPanel } from "@/components/goal-panel";
import { HoldingSheet } from "@/components/holding-sheet";
import { HoldingsPanel } from "@/components/holdings-panel";
import { OverviewPanel } from "@/components/overview-panel";
import { ProfileSwitch } from "@/components/profile-switch";
import { usePrices } from "@/hooks/use-prices";
import { formatTime, formatTwd } from "@/lib/format";
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
import {
  buildPortfolio,
  seedHoldings,
  type Holding,
  type PriceBook,
  type PortfolioView,
} from "@/lib/portfolio";
import {
  PROFILES,
  loadProfile,
  saveProfile,
  type ProfileId,
} from "@/lib/profiles";
import { cn } from "@/lib/utils";

type Tab = "home" | "holdings" | "goal" | "battle";

const TAB_KEY = "family-ledger-tab";

function loadTab(): Tab {
  if (typeof window === "undefined") return "home";
  try {
    const value = window.localStorage.getItem(TAB_KEY);
    if (value === "holdings" || value === "goal" || value === "battle" || value === "home") {
      return value;
    }
  } catch {
    /* ignore */
  }
  return "home";
}

function saveTab(tab: Tab) {
  try {
    window.localStorage.setItem(TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

export function LedgerApp() {
  const [profile, setProfile] = useState<ProfileId>(() => loadProfile());
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cost, setCost] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState<Holding[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [goalTwd, setGoalTwd] = useState(PROFILES.mom.goalTwd);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [lastVisit, setLastVisit] = useState<LastVisit | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<Tab>(() => loadTab());

  const meta = PROFILES[profile];
  const seed = useMemo(() => seedHoldings(profile), [profile]);
  const extraSymbols = useMemo(
    () => custom.map((h) => h.symbol),
    [custom],
  );
  const { book, status, refresh } = usePrices(extraSymbols);

  useEffect(() => {
    document.documentElement.dataset.profile = profile;
    document.title = meta.title;
    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", meta.themeColor);
  }, [profile, meta.title, meta.themeColor]);

  useEffect(() => {
    setQty(loadQty(profile));
    setCost(loadCost(profile));
    setCustom(loadCustom(profile));
    setHidden(loadHidden(profile));
    setGoalTwd(loadGoal(meta.goalTwd, profile));
    setHistory(loadHistory(profile));
    setLastVisit(loadLastVisit(profile));
    setSelectedId(null);
    setAdding(false);
  }, [profile, meta.goalTwd]);

  const view = useMemo(
    () =>
      buildPortfolio(
        book,
        qty,
        goalTwd,
        {
          custom,
          costOverrides: cost,
          hiddenIds: hidden,
          seedCostTwd: meta.costTwd,
        },
        seed,
      ),
    [book, qty, goalTwd, custom, cost, hidden, seed],
  );
  const selected = view.holdings.find((h) => h.id === selectedId) ?? null;
  const live = status === "live";

  const momView = useMemo(() => {
    if (profile === "mom") return view;
    return storedView("mom", book);
  }, [profile, view, book]);
  const dadView = useMemo(() => {
    if (profile === "dad") return view;
    return storedView("dad", book);
  }, [profile, view, book]);

  useEffect(() => {
    if (view.totalTwd < 1) return;
    const id = window.setTimeout(() => {
      setHistory(recordHistory(view.totalTwd, profile));
      saveLastVisit(view.totalTwd, profile);
    }, 8000);
    return () => window.clearTimeout(id);
  }, [view.totalTwd, profile]);

  const persistQty = (next: Record<string, number>) => {
    setQty(next);
    saveQty(next, profile);
  };
  const persistCost = (next: Record<string, number>) => {
    setCost(next);
    saveCost(next, profile);
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
      saveCustom(updated, profile);
    }
  };

  const hideOne = (id: string) => {
    const next = hidden.includes(id) ? hidden : [...hidden, id];
    setHidden(next);
    saveHidden(next, profile);
  };

  const switchProfile = (id: ProfileId) => {
    if (id === profile) return;
    saveProfile(id);
    setProfile(id);
  };

  const goTab = (next: Tab) => {
    setTab(next);
    saveTab(next);
  };

  return (
    <div className="relative min-h-dvh bg-bg text-ink">
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col md:max-w-4xl">
        <header className="sticky top-0 z-20 bg-bg/80 px-5 pb-3 pt-safe backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <ProfileSwitch value={profile} onChange={switchProfile} />
            <button
              type="button"
              onPointerDown={() => void refresh()}
              onClick={() => void refresh()}
              aria-label="更新市價"
              className="ml-auto flex size-11 items-center justify-center rounded-md bg-paper text-ink shadow-card transition-transform duration-150 ease-out active:scale-95"
            >
              <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
            </button>
          </div>
          <div className="mt-2 min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-faint">
              {live ? (
                <span className="inline-flex items-center gap-1 text-gain">
                  <span className="size-1.5 rounded-pill bg-gain" />
                  即時 {book ? formatTime(book.fetchedAt) : ""} 更新
                  {book?.usdTwd ? ` · 1 美元 ${formatTwd(book.usdTwd)}` : ""}
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
        </header>

        <main className="flex-1 px-5 pb-28 md:px-8">
          {tab === "home" ? (
            <OverviewPanel
              view={view}
              owner={meta.owner}
              lastVisit={lastVisit}
              usdTwd={book?.usdTwd ?? null}
              onOpenGoal={() => goTab("goal")}
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
                saveGoal(value, profile);
              }}
            />
          ) : null}
          {tab === "battle" ? (
            <BattlePanel mom={momView} dad={dadView} />
          ) : null}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 pb-safe backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-4 md:max-w-4xl">
          <TabBtn
            active={tab === "home"}
            onClick={() => goTab("home")}
            icon={<BookOpen className="size-5" />}
            label="總覽"
          />
          <TabBtn
            active={tab === "holdings"}
            onClick={() => goTab("holdings")}
            icon={<Wallet className="size-5" />}
            label="持倉"
          />
          <TabBtn
            active={tab === "battle"}
            onClick={() => goTab("battle")}
            icon={<Swords className="size-5" />}
            label="對決"
          />
          <TabBtn
            active={tab === "goal"}
            onClick={() => goTab("goal")}
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
            holdings: seed,
            custom,
            qty,
            cost,
            hidden,
            entry,
          });
          persistQty(next.qty);
          persistCost(next.cost);
          setCustom(next.custom);
          saveCustom(next.custom, profile);
          setHidden(next.hidden);
          saveHidden(next.hidden, profile);
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

function storedView(id: ProfileId, book: PriceBook | null): PortfolioView {
  const meta = PROFILES[id];
  return buildPortfolio(
    book,
    loadQty(id),
    loadGoal(meta.goalTwd, id),
    {
      custom: loadCustom(id),
      costOverrides: loadCost(id),
      hiddenIds: loadHidden(id),
      seedCostTwd: meta.costTwd,
    },
    seedHoldings(id),
  );
}
