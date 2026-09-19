type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconOverview({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" {...stroke} />
      <path d="M7.5 9h9M7.5 12.5h6.5M7.5 16h4" {...stroke} />
    </svg>
  );
}

export function IconHoldings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="9.2" cy="13.2" r="5.1" {...stroke} />
      <path d="M13.4 9.4a5.1 5.1 0 1 1 .2 7.8" {...stroke} />
      <path d="M9.2 11.1v4.2M7.4 13.2h3.6" {...stroke} />
    </svg>
  );
}

export function IconBattle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 19 16.2 9.8" {...stroke} />
      <path d="M14.2 6.4 17.6 9.8M16.6 5.2l2.6 2.6" {...stroke} />
      <path d="M17 19 7.8 9.8" {...stroke} />
      <path d="M9.8 6.4 6.4 9.8M7.4 5.2 4.8 7.8" {...stroke} />
    </svg>
  );
}

export function IconGoal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 3.6 14.7 9l5.7.6-4.3 3.8 1.3 5.6L12 16.4 6.6 19l1.3-5.6L3.6 9.6 9.3 9Z" {...stroke} />
    </svg>
  );
}
