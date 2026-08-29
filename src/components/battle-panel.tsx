import { useState } from "react";
import { Share2 } from "lucide-react";
import { BattleArena } from "@/components/battle-figures";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";
import {
  formatGapNumber,
  formatGoalShort,
  formatSignedPct,
  formatSignedTwd,
  formatTwd,
} from "@/lib/format";
import { btcQuantity, type PortfolioView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type Props = {
  mom: PortfolioView;
  dad: PortfolioView;
};

function roi(view: PortfolioView): number | null {
  return view.roiPct;
}

function buildBattleText(mom: PortfolioView, dad: PortfolioView): string {
  const lines = [
    `爸媽資產對決（比報酬率）`,
    `媽媽 ${mom.roiPct !== null ? formatSignedPct(mom.roiPct) : "—"}（投入 6.5 萬）`,
    `爸爸 ${dad.roiPct !== null ? formatSignedPct(dad.roiPct) : "—"}（投入 10 萬）`,
  ];
  return lines.join("\n");
}

export function BattlePanel({ mom, dad }: Props) {
  const [copied, setCopied] = useState(false);
  const momRoi = roi(mom);
  const dadRoi = roi(dad);
  const momShown = useCountUp((momRoi ?? 0) * 100);
  const dadShown = useCountUp((dadRoi ?? 0) * 100);
  const momBar = Math.max(0, momRoi ?? 0);
  const dadBar = Math.max(0, dadRoi ?? 0);
  const barSum = momBar + dadBar;
  const momShare = barSum > 0 ? momBar / barSum : 0.5;
  const dadShare = 1 - momShare;
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
  const todayLead = (dad.todayDeltaPct ?? 0) - (mom.todayDeltaPct ?? 0);
  const todayWinner =
    mom.todayDeltaPct === null && dad.todayDeltaPct === null
      ? "tie"
      : todayLead > 0.001
        ? "dad"
        : todayLead < -0.001
          ? "mom"
          : "tie";

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
        <p className="text-center text-sm font-medium text-muted">爸媽對決</p>

        <BattleArena winner={roiWinner} />

        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-mom">媽媽</p>
            <p
              className={cn(
                "font-serif text-3xl tabular-nums tracking-tight",
                toneOf(momRoi) === "gain" && "text-gain",
                toneOf(momRoi) === "loss" && "text-loss",
              )}
            >
              {momRoi === null
                ? "—"
                : `${momShown >= 0 ? "+" : ""}${momShown.toFixed(1)}%`}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              投入 {mom.investedTwd > 0 ? formatTwd(mom.investedTwd) : "—"}
            </p>
          </div>
          <p className="pb-5 text-xs text-faint">對</p>
          <div className="text-right">
            <p className="text-xs font-medium text-dad">爸爸</p>
            <p
              className={cn(
                "font-serif text-3xl tabular-nums tracking-tight",
                toneOf(dadRoi) === "gain" && "text-gain",
                toneOf(dadRoi) === "loss" && "text-loss",
              )}
            >
              {dadRoi === null
                ? "—"
                : `${dadShown >= 0 ? "+" : ""}${dadShown.toFixed(1)}%`}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              投入 {dad.investedTwd > 0 ? formatTwd(dad.investedTwd) : "—"}
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
          <span>{momRoi === null ? "—" : formatSignedPct(momRoi)}</span>
          <span>{dadRoi === null ? "—" : formatSignedPct(dadRoi)}</span>
        </div>
      </section>

      <section
        className="battle-stagger rounded-xl bg-paper p-5 shadow-card"
        style={{ animationDelay: "120ms" }}
      >
        <h3 className="text-center font-serif text-lg">比一比</h3>
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
            winner={null}
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
            winner={null}
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
              mom.todayDeltaPct === null
                ? "—"
                : formatSignedPct(mom.todayDeltaPct)
            }
            dad={
              dad.todayDeltaPct === null
                ? "—"
                : formatSignedPct(dad.todayDeltaPct)
            }
            winner={todayWinner}
            momTone={toneOf(mom.todayDeltaPct)}
            dadTone={toneOf(dad.todayDeltaPct)}
            delay={320}
          />
          <Row
            label="離目標"
            mom={
              mom.gapTwd <= 0 ? "已達標" : formatGapNumber(mom.gapTwd)
            }
            dad={
              dad.gapTwd <= 0 ? "已達標" : formatGapNumber(dad.gapTwd)
            }
            winner={
              Math.abs(mom.progress - dad.progress) < 0.005
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
        <p className="mt-4 text-center text-sm leading-relaxed text-muted">
          本金不一樣，用報酬率比才公平。
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
      <p className="text-center text-xs text-muted">{label}</p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <p
          className={cn(
            "text-center font-serif text-lg tabular-nums",
            momTone === "gain" && "text-gain",
            momTone === "loss" && "text-loss",
            winner === "mom" && momTone === "neutral" && "text-mom",
          )}
        >
          {mom}
        </p>
        <p
          className={cn(
            "text-center font-serif text-lg tabular-nums",
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