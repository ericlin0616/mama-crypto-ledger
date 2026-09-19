import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { ProfileId } from "@/lib/profiles";

type Props = {
  value: ProfileId;
  onChange: (id: ProfileId) => void;
  onSecret?: (event: { clientX: number; clientY: number }) => void;
};

export function ProfileSwitch({ value, onChange, onSecret }: Props) {
  const taps = useRef(0);

  const bumpSecret = (event: { clientX: number; clientY: number }) => {
    taps.current += 1;
    window.setTimeout(() => {
      taps.current = Math.max(0, taps.current - 1);
    }, 1400);
    if (taps.current >= 3) {
      taps.current = 0;
      onSecret?.(event);
    }
  };

  return (
    <div
      className="glass-switch"
      role="tablist"
      aria-label="切換帳本"
      onPointerDown={bumpSecret}
    >
      <span
        className={cn("glass-thumb", value === "dad" && "glass-thumb-dad")}
        aria-hidden="true"
      />
      <button
        type="button"
        role="tab"
        aria-selected={value === "mom"}
        onPointerDown={() => onChange("mom")}
        onClick={() => onChange("mom")}
        className={cn(
          "relative z-10 h-11 rounded-pill px-5 text-sm font-medium",
          value === "mom" ? "text-ink" : "text-muted",
        )}
      >
        媽媽
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "dad"}
        onPointerDown={() => onChange("dad")}
        onClick={() => onChange("dad")}
        className={cn(
          "relative z-10 h-11 rounded-pill px-5 text-sm font-medium",
          value === "dad" ? "text-ink" : "text-muted",
        )}
      >
        爸爸
      </button>
    </div>
  );
}
