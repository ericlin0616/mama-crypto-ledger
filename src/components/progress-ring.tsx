import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  progress: number;
  className?: string;
  children?: ReactNode;
};

export function ProgressRing({ progress, className, children }: Props) {
  const clamped = Math.max(0, Math.min(progress, 1.2));
  const radius = 54;
  const stroke = 8;
  const c = 2 * Math.PI * radius;
  const offset = c * (1 - Math.min(clamped, 1));

  return (
    <div className={cn("relative mx-auto size-44", className)}>
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {children}
      </div>
    </div>
  );
}
