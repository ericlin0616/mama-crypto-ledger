export type EasterKind = "coins" | "rocket" | "spark" | "hearts";

export type EasterEvent = {
  kind: EasterKind;
  x?: number;
  y?: number;
  text?: string;
};

type Listener = (event: EasterEvent) => void;

const listeners = new Set<Listener>();

export function fireEaster(event: EasterEvent) {
  listeners.forEach((fn) => fn(event));
}

export function onEaster(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function tapPoint(event: { clientX: number; clientY: number }) {
  return { x: event.clientX, y: event.clientY };
}
