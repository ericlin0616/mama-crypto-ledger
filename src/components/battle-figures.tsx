import { cn } from "@/lib/utils";

type Winner = "mom" | "dad" | "tie";

function Crown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 28"
      className={cn("battle-crown h-7 w-12", className)}
      aria-hidden="true"
    >
      <path
        d="M6 22 10 8l8 8 6-12 6 12 8-8 4 14H6Z"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2.2" fill="var(--color-accent)" />
      <circle cx="24" cy="5" r="2.4" fill="var(--color-accent)" />
      <circle cx="38" cy="8" r="2.2" fill="var(--color-accent)" />
    </svg>
  );
}

function MomFigure() {
  return (
    <svg viewBox="0 0 88 112" className="h-28 w-24" aria-hidden="true">
      <ellipse cx="44" cy="104" rx="26" ry="6" fill="var(--color-line)" />
      <rect x="26" y="62" width="36" height="40" rx="16" fill="var(--color-mom)" />
      <circle cx="44" cy="38" r="22" fill="#f3e6d4" />
      <path
        d="M22 40c0-16 10-28 22-28s22 12 22 28v6H22v-6Z"
        fill="var(--color-mom)"
      />
      <circle cx="44" cy="14" r="8" fill="var(--color-mom)" />
      <circle cx="35" cy="40" r="2.2" fill="var(--color-ink)" />
      <circle cx="53" cy="40" r="2.2" fill="var(--color-ink)" />
      <path
        d="M36 50c5 4 11 4 16 0"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="30" cy="46" r="3" fill="#e8b8a8" opacity="0.7" />
      <circle cx="58" cy="46" r="3" fill="#e8b8a8" opacity="0.7" />
    </svg>
  );
}

function DadFigure() {
  return (
    <svg viewBox="0 0 88 112" className="h-28 w-24" aria-hidden="true">
      <ellipse cx="44" cy="104" rx="26" ry="6" fill="var(--color-line)" />
      <rect x="24" y="62" width="40" height="40" rx="12" fill="var(--color-dad)" />
      <circle cx="44" cy="38" r="22" fill="#f0e4d4" />
      <path d="M20 34c2-16 12-24 24-24s22 8 24 24H20Z" fill="var(--color-dad)" />
      <circle
        cx="34"
        cy="40"
        r="7"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.8"
      />
      <circle
        cx="54"
        cy="40"
        r="7"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.8"
      />
      <path d="M41 40h6" stroke="var(--color-ink)" strokeWidth="1.8" />
      <circle cx="34" cy="40" r="1.8" fill="var(--color-ink)" />
      <circle cx="54" cy="40" r="1.8" fill="var(--color-ink)" />
      <path
        d="M36 51c4 3 8 3 12 0"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BattleArena({ winner }: { winner: Winner }) {
  return (
    <div className="battle-arena relative mx-auto mt-2 h-36 w-full max-w-sm">
      <span className="battle-coin battle-coin-1" aria-hidden="true" />
      <span className="battle-coin battle-coin-2" aria-hidden="true" />
      <span className="battle-coin battle-coin-3" aria-hidden="true" />

      <div className="battle-pop absolute left-1 top-4" style={{ animationDelay: "60ms" }}>
        {winner === "mom" ? (
          <Crown className="absolute -top-3 left-6" />
        ) : (
          <span className="block h-7" />
        )}
        <MomFigure />
      </div>

      <div className="battle-vs absolute left-1/2 top-12 z-10 -translate-x-1/2">
        VS
      </div>

      <div className="battle-pop absolute right-1 top-4" style={{ animationDelay: "140ms" }}>
        {winner === "dad" ? (
          <Crown className="absolute -top-3 right-6" />
        ) : (
          <span className="block h-7" />
        )}
        <DadFigure />
      </div>

      <svg
        viewBox="0 0 240 16"
        className="absolute bottom-3 left-10 right-10 h-4"
        aria-hidden="true"
      >
        <path
          d="M8 8c24-8 48 8 72 0s48 8 72 0 48 8 72 0"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="battle-rope"
        />
      </svg>
    </div>
  );
}
