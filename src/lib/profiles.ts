export type ProfileId = "mom" | "dad";

export type ProfileMeta = {
  id: ProfileId;
  owner: "媽媽" | "爸爸";
  title: string;
  goalTwd: number;
  costTwd: number | null;
  themeColor: string;
};

export const PROFILES: Record<ProfileId, ProfileMeta> = {
  mom: {
    id: "mom",
    owner: "媽媽",
    title: "媽媽的加密帳本",
    goalTwd: 100_000,
    costTwd: 65_000,
    themeColor: "#efe8dc",
  },
  dad: {
    id: "dad",
    owner: "爸爸",
    title: "爸爸的加密帳本",
    goalTwd: 130_000,
    costTwd: 100_000,
    themeColor: "#d8dee8",
  },
};

const WHO_KEY = "family-ledger-who";

export function loadProfile(): ProfileId {
  if (typeof window === "undefined") return "mom";
  try {
    return window.localStorage.getItem(WHO_KEY) === "dad" ? "dad" : "mom";
  } catch {
    return "mom";
  }
}

export function saveProfile(id: ProfileId) {
  window.localStorage.setItem(WHO_KEY, id);
}
