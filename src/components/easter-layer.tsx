import { useEffect, useState } from "react";
import { onEaster, type EasterEvent, type EasterKind } from "@/lib/easter";
import { useMotion } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

type Burst = EasterEvent & { id: number };

export function EasterLayer() {
  const motion = useMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    return onEaster((event) => {
      const id = Date.now() + Math.random();
      setBursts((prev) => [...prev.slice(-4), { ...event, id }]);
      if (event.text) setToast(event.text);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 1800);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {motion ? (
        <div className="ambient">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
          <span className="orb orb-d" />
        </div>
      ) : null}

      {motion
        ? bursts.map((burst) =>
            burst.kind === "rocket" ? (
              <span key={burst.id} className="easter-rocket" />
            ) : (
              <CoinBurst
                key={burst.id}
                x={burst.x ?? 80}
                y={burst.y ?? 80}
                kind={burst.kind}
              />
            ),
          )
        : null}

      {toast ? <p className="easter-toast">{toast}</p> : null}
    </div>
  );
}

function CoinBurst({
  x,
  y,
  kind,
}: {
  x: number;
  y: number;
  kind: EasterKind;
}) {
  const n = kind === "spark" ? 8 : kind === "hearts" ? 12 : 16;
  return (
    <span className="absolute" style={{ left: x, top: y }}>
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2 + (kind === "spark" ? 0.4 : 0.12);
        const dist =
          kind === "spark"
            ? 48 + (i % 3) * 12
            : kind === "hearts"
              ? 64 + (i % 4) * 16
              : 70 + (i % 5) * 18;
        return (
          <span
            key={i}
            className={cn(
              "easter-coin",
              kind === "spark" && "easter-spark",
              kind === "hearts" && "easter-heart",
            )}
            style={{
              ["--dx" as string]: `${Math.cos(angle) * dist}px`,
              ["--dy" as string]: `${Math.sin(angle) * dist + (kind === "coins" ? 90 : kind === "hearts" ? 40 : 0)}px`,
              animationDelay: `${i * 18}ms`,
            }}
          />
        );
      })}
    </span>
  );
}
