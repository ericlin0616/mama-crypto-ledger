import { cn } from "@/lib/utils";
import type { ProfileId } from "@/lib/profiles";

type Props = {
  value: ProfileId;
  onChange: (id: ProfileId) => void;
};

export function ProfileSwitch({ value, onChange }: Props) {
  return (
    <div className="glass-switch" role="tablist" aria-label="切換帳本">
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
