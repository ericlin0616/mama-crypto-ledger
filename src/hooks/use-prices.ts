import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPricesInBrowser, getLivePrices } from "@/lib/prices";
import type { PriceBook } from "@/lib/portfolio";

type Status = "idle" | "loading" | "live" | "error";

const REFRESH_MS = 30_000;

function isPriceBook(value: unknown): value is PriceBook {
  if (!value || typeof value !== "object") return false;
  const quotes = (value as PriceBook).quotes;
  return !!quotes && typeof quotes === "object";
}

export function usePrices(extraSymbols: string[] = []) {
  const [book, setBook] = useState<PriceBook | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const extrasRef = useRef(extraSymbols);
  extrasRef.current = extraSymbols;

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus((prev) => (prev === "live" ? "live" : "loading"));
    setError(null);
    const extras = extrasRef.current;
    try {
      let next: PriceBook | null = null;
      try {
        const server = await getLivePrices();
        if (isPriceBook(server)) next = server;
      } catch {
        /* static hosts have no /_serverFn */
      }
      if (!next || extras.length) {
        const browser = await fetchPricesInBrowser(extras);
        if (isPriceBook(browser)) {
          next = next
            ? {
                ...browser,
                quotes: { ...next.quotes, ...browser.quotes },
                fetchedAt: Date.now(),
              }
            : browser;
        }
      }
      if (!isPriceBook(next)) throw new Error("無法取得市價");
      setBook(next);
      setStatus("live");
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法取得市價");
      setStatus((prev) => (prev === "live" ? "live" : "error"));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { book, status, error, refresh };
}
