import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { AddEntrySheet } from "@/components/add-entry-sheet";
import { BattlePanel } from "@/components/battle-panel";
import {
  IconBattle,
  IconGoal,
  IconHoldings,
  IconOverview,
} from "@/components/dock-icons";
import { EasterLayer } from "@/components/easter-layer";
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
  loadHidden,
  loadLastVisit,
  loadQty,
  recordHistory,
  saveCost,
  saveCustom,
  saveHidden,
  saveLastVisit,
  saveQty,
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
import { fireEaster, tapPoint } from "@/lib/easter";

type Tab = "home" | "holdings" | "goal" | "battle";

const TAB_KEY = "family-ledger-tab";
const SECRETS: Record<ProfileId, string[]> = {
  mom: ["穩定幣也算錢", "十萬全賣就達標", "慢慢存，別急", "別一直刷新，它知道"],
  dad: ["本金十萬才公平", "目標十三萬全賣", "報酬率比總額重要", "別一直刷新，它知道"],
};

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
  const [lastVisit, setLastVisit] = useState<LastVisit | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<Tab>(() => loadTab());
  const [secret, setSecret] = useState<string | null>(null);
  const welcomed = useRef(false);
  const goalOnce = useRef<Partial<Record<ProfileId, boolean>>>({});
  const sawTotal = useRef(false);
  const battleOnce = useRef(false);
  const refreshTaps = useRef(0);

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
    setLastVisit(loadLastVisit(profile));
    setSelectedId(null);
    setAdding(false);
    sawTotal.current = false;
  }, [profile]);

  useEffect(() => {
    if (welcomed.current) return;
    welcomed.current = true;
    const id = window.setTimeout(() => {
      fireEaster({
        kind: "spark",
        x: 96,
        y: 52,
        text: "回來了，先看爸媽帳本",
      });
    }, 650);
    return () => window.clearTimeout(id);
  }, []);

  const view = useMemo(
    () =>
      buildPortfolio(
        book,
        qty,
        meta.goalTwd,
        {
          custom,
          costOverrides: cost,
          hiddenIds: hidden,
          seedCostTwd: meta.costTwd,
        },
        seed,
      ),
    [book, qty, meta.goalTwd, custom, cost, hidden, seed, meta.costTwd],
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
    if (view.totalTwd >= meta.goalTwd && sawTotal.current && !goalOnce.current[profile]) {
      goalOnce.current[profile] = true;
      fireEaster({
        kind: "coins",
        x: window.innerWidth / 2,
        y: 90,
        text: `${meta.owner}達標了`,
      });
    }
    if (view.totalTwd > 1) sawTotal.current = true;
  }, [view.totalTwd, meta.goalTwd, meta.owner, profile]);

  useEffect(() => {
    if (view.totalTwd < 1) return;
    const id = window.setTimeout(() => {
      recordHistory(view.totalTwd, profile);
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
    fireEaster({
      kind: "spark",
      x: 120,
      y: 48,
      text: `換成${PROFILES[id].owner}的帳本`,
    });
  };

  const goTab = (next: Tab) => {
    if (next === "battle" && tab !== "battle" && !battleOnce.current) {
      battleOnce.current = true;
      fireEaster({ kind: "rocket", text: "爸媽對決開始" });
    }
    setTab(next);
    saveTab(next);
  };

  const bumpRefresh = () => {
    refreshTaps.current += 1;
    window.setTimeout(() => {
      refreshTaps.current = Math.max(0, refreshTaps.current - 1);
    }, 1800);
    if (refreshTaps.current >= 5) {
      refreshTaps.current = 0;
      fireEaster({
        kind: "spark",
        x: window.innerWidth - 40,
        y: 48,
        text: "別一直刷新，它知道",
      });
    }
    void refresh();
  };

  const tabs: Tab[] = ["home", "holdings", "battle", "goal"];
  const tabIndex = Math.max(0, tabs.indexOf(tab));

  return (
    <div className="relative min-h-dvh bg-bg text-ink">
      <EasterLayer />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col md:max-w-4xl">
        <header className="sticky top-0 z-20 bg-bg/70 px-5 pb-3 pt-safe backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <ProfileSwitch
              value={profile}
              onChange={switchProfile}
              onSecret={(e) => {
                fireEaster({
                  kind: "coins",
                  ...tapPoint(e),
                  text: `${meta.owner}的金幣雨`,
                });
              }}
            />
            <button
              type="button"
              className="ml-auto flex size-11 items-center justify-center rounded-md bg-paper text-ink shadow-card transition-transform duration-150 ease-out active:scale-95"
              onPointerDown={bumpRefresh}
              onClick={bumpRefresh}
              aria-label="更新市價"
            >
              <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
            </button>
          </div>
          <div className="mt-2 min-w-0">
            <button
              type="button"
              className="block bg-transparent p-0 text-left"
              onPointerDown={() => {
                const pool = SECRETS[profile];
                const line = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
                setSecret(line);
                window.setTimeout(() => setSecret(null), 2400);
              }}
            >
              <p className="brand-shimmer text-xs font-medium tracking-[0.16em]">
                {meta.title}
              </p>
            </button>
            {secret ? (
              <p className="secret-line mt-1 text-xs text-accent">{secret}</p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
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
            )}
          </div>
        </header>

        <main className="flex-1 px-5 pb-32 md:px-8">
          {tab === "home" ? (
            <OverviewPanel
              view={view}
              owner={meta.owner}
              lastVisit={lastVisit}
              usdTwd={book?.usdTwd ?? null}
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
            <GoalPanel view={view} owner={meta.owner} />
          ) : null}
          {tab === "battle" ? (
            <BattlePanel mom={momView} dad={dadView} />
          ) : null}
        </main>
      </div>

      <nav className="glass-dock" aria-label="主要分頁">
        <div className="glass-dock-bar">
          <span
            className="glass-dock-thumb"
            style={{ transform: `translateX(${tabIndex * 100}%)` }}
            aria-hidden="true"
          />
          <TabBtn
            active={tab === "home"}
            onClick={() => goTab("home")}
            icon={<IconOverview className="size-5" />}
            label="總覽"
          />
          <TabBtn
            active={tab === "holdings"}
            onClick={() => goTab("holdings")}
            icon={<IconHoldings className="size-5" />}
            label="持倉"
          />
          <TabBtn
            active={tab === "battle"}
            onClick={() => goTab("battle")}
            icon={<IconBattle className="size-5" />}
            label="對決"
          />
          <TabBtn
            active={tab === "goal"}
            onClick={() => goTab("goal")}
            icon={<IconGoal className="size-5" />}
            label="達標"
          />
        </div>
      </nav>

      <HoldingSheet
        holding={selected}
        gapTwd={view.gapTwd}
        goalTwd={meta.goalTwd}
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
        "relative z-10 flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-200",
        active ? "text-ink" : "text-faint",
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
    meta.goalTwd,
    {
      custom: loadCustom(id),
      costOverrides: loadCost(id),
      hiddenIds: loadHidden(id),
      seedCostTwd: meta.costTwd,
    },
    seedHoldings(id),
  );
}
