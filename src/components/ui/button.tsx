import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent/90 focus-visible:ring-accent",
  secondary:
    "bg-paper text-ink shadow-card hover:bg-paper/80 focus-visible:ring-accent",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 focus-visible:ring-accent",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
        "touch-manipulation",
        "transition-[transform,background-color,opacity] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:not-disabled:scale-[0.96]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
