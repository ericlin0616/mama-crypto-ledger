import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { BattleArena } from "@/components/battle-figures";
import { Button } from "@/components/ui/button";
import {
  formatGoalShort,
  formatPct,
  formatSignedPct,
  formatSignedTwd,
  formatTwd,
  formatTwdNumber,
  formatWan,
} from "@/lib/format";
import { btcQuantity, type PortfolioView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  mom: PortfolioView;
  dad: PortfolioView;
};

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(target * eased);
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function roi(view: PortfolioView): number | null {
  return view.roiPct;
}

function buildBattleText(mom: PortfolioView, dad: PortfolioView): string {
  const lead = dad.totalTwd - mom.totalTwd;
  const lines = [
    `爸媽資產對決`,
    `媽媽 ${formatTwd(mom.totalTwd)}（投入 6.5 萬）`,
    `爸爸 ${formatTwd(dad.totalTwd)}（投入 10 萬）`,
  ];
  if (Math.abs(lead) < 1) lines.push("兩人現在差不多。");
  else if (lead > 0) lines.push(`爸爸目前多 ${formatTwd(lead)}`);
  else lines.push(`媽媽目前多 ${formatTwd(-lead)}`);
  if (mom.roiPct !== null) lines.push(`媽媽報酬 ${formatSignedPct(mom.roiPct)}`);
  if (dad.roiPct !== null) lines.push(`爸爸報酬 ${formatSignedPct(dad.roiPct)}`);
  return lines.join("\n");
}

export function BattlePanel({ mom, dad }: Props) {
  const [copied, setCopied] = useState(false);
  const momShown = useCountUp(mom.totalTwd);
  const dadShown = useCountUp(dad.totalTwd);
  const combined = mom.totalTwd + dad.totalTwd;
  const dadShare = combined > 0 ? dad.totalTwd / combined : 0.5;
  const momShare = 1 - dadShare;
  const lead = dad.totalTwd - mom.totalTwd;
  const momRoi = roi(mom);
  const dadRoi = roi(dad);
  const sizeWinner = lead > 50 ? "dad" : lead < -50 ? "mom" : "tie";
  const roiWinner =
    momRoi === null && dadRoi === null
      ? "tie"
      : momRoi === null
        ? "dad"
        : dadRoi === null
          ? "mom"
          : dadRoi - momRoi > 0.002
            ? "dad"
            : momRoi - dadRoi > 0.002
              ? "mom"
              : "tie";
  const todayLead = (dad.todayDeltaTwd ?? 0) - (mom.todayDeltaTwd ?? 0);
  const todayWinner =
    mom.todayDeltaTwd === null && dad.todayDeltaTwd === null
      ? "tie"
      : todayLead > 20
        ? "dad"
        : todayLead < -20
          ? "mom"
          : "tie";

  const headline =
    sizeWinner === "tie"
      ? "兩人的口袋現在差不多。"
      : sizeWinner === "dad"
        ? `爸爸目前多 ${formatWan(lead)}。`
        : `媽媽目前多 ${formatWan(-lead)}。`;

  const skillLine =
    roiWinner === "tie"
      ? "報酬率打成平手。"
      : roiWinner === "dad"
        ? "比誰比較會賺，這次爸爸贏。"
        : "比誰比較會賺，這次媽媽贏。";

  const share = async () => {
    const text = buildBattleText(mom, dad);
    try {
      if (navigator.share) {
        await navigator.share({ text, title: "爸媽資產對決" });
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("複製下面這段", text);
    }
  };

  const momBtc = btcQuantity(mom);
  const dadBtc = btcQuantity(dad);

  return (
    <div className="flex flex-col gap-4">
      <section className="battle-stagger overflow-hidden rounded-xl bg-paper p-5 shadow-card">
        <p className="text-sm font-medium text-muted">爸媽對決</p>
        <h2 className="mt-1 font-serif text-2xl leading-snug">{headline}</h2>
        <p className="mt-2 text-sm text-muted">{skillLine}</p>

        <BattleArena winner={sizeWinner} />

        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-mom">媽媽</p>
            <p className="font-serif text-3xl tabular-nums tracking-tight">
              {formatTwdNumber(momShown)}
            </p>
          </div>
          <p className="pb-1 text-xs text-faint">對</p>
          <div className="text-right">
            <p className="text-xs font-medium text-dad">爸爸</p>
            <p className="font-serif text-3xl tabular-nums tracking-tight">
              {formatTwdNumber(dadShown)}
            </p>
          </div>
        </div>

        <div className="battle-bar mt-4 flex h-3 overflow-hidden rounded-pill bg-line">
          <div
            className="h-full bg-mom transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(4, momShare * 100)}%` }}
          />
          <div
            className="h-full bg-dad transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(4, dadShare * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-faint">
          <span>{formatPct(momShare)}</span>
          <span>{formatPct(dadShare)}</span>
        </div>
      </section>

      <section
        className="battle-stagger rounded-xl bg-paper p-5 shadow-card"
        style={{ animationDelay: "120ms" }}
      >
        <h3 className="font-serif text-lg">比一比</h3>
        <ul className="mt-4 flex flex-col">
          <Row
            label="總投入"
            mom={mom.investedTwd > 0 ? formatTwd(mom.investedTwd) : "—"}
            dad={dad.investedTwd > 0 ? formatTwd(dad.investedTwd) : "—"}
            winner={null}
            delay={160}
          />
          <Row
            label="現在值多少"
            mom={formatTwd(mom.totalTwd)}
            dad={formatTwd(dad.totalTwd)}
            winner={sizeWinner}
            delay={200}
          />
          <Row
            label="賺了或虧了"
            mom={
              mom.totalPnlTwd === null ? "—" : formatSignedTwd(mom.totalPnlTwd)
            }
            dad={
              dad.totalPnlTwd === null ? "—" : formatSignedTwd(dad.totalPnlTwd)
            }
            winner={roiWinner}
            momTone={toneOf(mom.totalPnlTwd)}
            dadTone={toneOf(dad.totalPnlTwd)}
            delay={240}
          />
          <Row
            label="報酬率"
            mom={momRoi === null ? "—" : formatSignedPct(momRoi)}
            dad={dadRoi === null ? "—" : formatSignedPct(dadRoi)}
            winner={roiWinner}
            momTone={toneOf(momRoi)}
            dadTone={toneOf(dadRoi)}
            delay={280}
          />
          <Row
            label="今日大約"
            mom={
              mom.todayDeltaTwd === null
                ? "—"
                : formatSignedTwd(mom.todayDeltaTwd)
            }
            dad={
              dad.todayDeltaTwd === null
                ? "—"
                : formatSignedTwd(dad.todayDeltaTwd)
            }
            winner={todayWinner}
            momTone={toneOf(mom.todayDeltaTwd)}
            dadTone={toneOf(dad.todayDeltaTwd)}
            delay={320}
          />
          <Row
            label="離目標"
            mom={
              mom.gapTwd <= 0 ? "已達標" : `還差 ${formatWan(mom.gapTwd)}`
            }
            dad={
              dad.gapTwd <= 0 ? "已達標" : `還差 ${formatWan(dad.gapTwd)}`
            }
            winner={
              mom.progress === dad.progress
                ? "tie"
                : mom.progress > dad.progress
                  ? "mom"
                  : "dad"
            }
            delay={360}
          />
          <Row
            label="目標"
            mom={formatGoalShort(mom.goalTwd)}
            dad={formatGoalShort(dad.goalTwd)}
            winner={null}
            delay={400}
          />
          <Row
            label="比特幣顆數"
            mom={momBtc > 0 ? momBtc.toFixed(4) : "—"}
            dad={dadBtc > 0 ? dadBtc.toFixed(4) : "—"}
            winner={momBtc === dadBtc ? "tie" : momBtc > dadBtc ? "mom" : "dad"}
            delay={440}
          />
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          媽媽總投入 6.5 萬，爸爸 10 萬。口袋比較鼓不一定比較會賺，報酬率才是同一筆錢比出來的結果。
        </p>
      </section>

      <div className="battle-stagger" style={{ animationDelay: "200ms" }}>
        <Button
          variant="secondary"
          onPointerDown={() => void share()}
          onClick={() => void share()}
          className="w-full"
        >
          <Share2 className="size-4" />
          {copied ? "已複製" : "把對決傳給家人"}
        </Button>
      </div>
    </div>
  );
}

function toneOf(n: number | null): "gain" | "loss" | "neutral" {
  if (n === null || Math.abs(n) < 1e-9) return "neutral";
  return n > 0 ? "gain" : "loss";
}

function Row({
  label,
  mom,
  dad,
  winner,
  momTone = "neutral",
  dadTone = "neutral",
  delay = 0,
}: {
  label: string;
  mom: string;
  dad: string;
  winner: "mom" | "dad" | "tie" | null;
  momTone?: "gain" | "loss" | "neutral";
  dadTone?: "gain" | "loss" | "neutral";
  delay?: number;
}) {
  return (
    <li
      className="battle-stagger border-t border-line py-3 first:border-t-0 first:pt-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <p
          className={cn(
            "font-serif text-lg tabular-nums",
            momTone === "gain" && "text-gain",
            momTone === "loss" && "text-loss",
            winner === "mom" && momTone === "neutral" && "text-mom",
          )}
        >
          {mom}
        </p>
        <p
          className={cn(
            "text-right font-serif text-lg tabular-nums",
            dadTone === "gain" && "text-gain",
            dadTone === "loss" && "text-loss",
            winner === "dad" && dadTone === "neutral" && "text-dad",
          )}
        >
          {dad}
        </p>
      </div>
    </li>
  );
}