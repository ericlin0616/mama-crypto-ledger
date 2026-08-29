export function formatTwd(value: number, digits?: number): string {
  const abs = Math.abs(value);
  const resolved =
    digits ?? (abs >= 100 ? 0 : abs >= 1 ? 2 : abs === 0 ? 0 : 4);
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: resolved,
    minimumFractionDigits: resolved,
  }).format(value);
}

export function formatTwdNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatWan(value: number): string {
  const wan = value / 10_000;
  const digits = Math.abs(wan) >= 10 ? 1 : 2;
  const body = new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(wan);
  return `${body} 萬`;
}

export function formatGoalShort(value: number): string {
  if (value >= 10_000 && value % 10_000 === 0) {
    return `${value / 10_000} 萬`;
  }
  return formatTwdNumber(value);
}

export function formatGoalWan(value: number): string {
  const wan = value / 10_000;
  if (Math.abs(wan - Math.round(wan)) < 0.05) {
    return `${Math.round(wan)}萬`;
  }
  return `${wan.toFixed(1)}萬`;
}

export function formatPct(ratio: number, digits?: number): string {
  const pct = ratio * 100;
  const resolved = digits ?? (Math.abs(pct) >= 10 ? 0 : 1);
  return `${pct.toFixed(resolved)}%`;
}

export function formatSignedPct(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  const sign = ratio > 0 ? "+" : "";
  return `${sign}${formatPct(ratio)}`;
}

export function formatSignedTwd(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.5) return formatTwd(0);
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatTwd(value)}`;
}

export function formatUsd(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatQty(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

export function formatRelative(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60_000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.round(hours / 24);
  if (days === 1) return "昨天";
  return `${days} 天前`;
}

export function formatMd(ts: number): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
  }).format(new Date(ts));
}

export function formatSlot12h(ts: number): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(ts)),
  );
  return `${formatMd(ts)} ${hour < 12 ? "早上" : "晚上"}`;
}
