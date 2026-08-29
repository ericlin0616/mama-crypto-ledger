import { cn } from "@/lib/utils";

type Winner = "mom" | "dad" | "tie";

const MOM_SRC = `${import.meta.env.BASE_URL}battle/mom-v2.jpg`;
const DAD_SRC = `${import.meta.env.BASE_URL}battle/dad-v2.jpg`;

function Crown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 30"
      className={cn("battle-crown h-6 w-11", className)}
      aria-hidden="true"
    >
      <path
        d="M6 24 11 8l9 9 6-13 6 13 9-9 5 16H6Z"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="8" r="2.3" fill="var(--color-accent)" />
      <circle cx="26" cy="5" r="2.5" fill="var(--color-accent)" />
      <circle cx="41" cy="8" r="2.3" fill="var(--color-accent)" />
    </svg>
  );
}

function Portrait({
  src,
  alt,
  ring,
}: {
  src: string;
  alt: string;
  ring: "mom" | "dad";
}) {
  return (
    <span
      className={cn(
        "relative block size-24 overflow-hidden rounded-full shadow-card ring-2",
        ring === "mom" ? "ring-mom" : "ring-dad",
      )}
    >
      <img
        src={src}
        alt={alt}
        width={96}
        height={96}
        className="size-full object-cover"
      />
    </span>
  );
}

export function BattleArena({ winner }: { winner: Winner }) {
  return (
    <div className="battle-arena relative mx-auto mt-3 h-40 w-full max-w-sm">
      <span className="battle-coin battle-coin-1" aria-hidden="true" />
      <span className="battle-coin battle-coin-2" aria-hidden="true" />
      <span className="battle-coin battle-coin-3" aria-hidden="true" />

      <div
        className="battle-pop absolute left-2 top-5 flex flex-col items-center"
        style={{ animationDelay: "60ms" }}
      >
        {winner === "mom" ? <Crown className="-mb-1" /> : <span className="h-6" />}
        <Portrait src={MOM_SRC} alt="媽媽" ring="mom" />
      </div>

      <div className="battle-vs absolute left-1/2 top-14 z-10 -translate-x-1/2">
        VS
      </div>

      <div
        className="battle-pop absolute right-2 top-5 flex flex-col items-center"
        style={{ animationDelay: "140ms" }}
      >
        {winner === "dad" ? <Crown className="-mb-1" /> : <span className="h-6" />}
        <Portrait src={DAD_SRC} alt="爸爸" ring="dad" />
      </div>
    </div>
  );
}
