import { useState } from "react";
import { cn } from "@/lib/utils";

const FILES: Record<string, string> = {
  BTC: "btc.svg",
  BITLAYER_BTC: "btc.svg",
  ETH: "eth.svg",
  SOL: "sol.svg",
  BNB: "bnb.svg",
  SUI: "sui.png",
  SEI: "sei.png",
  ARB: "arb.png",
  ADA: "ada.svg",
  APT: "apt.png",
  OP: "op.png",
  POL: "matic.svg",
  DOGE: "doge.svg",
  XRP: "xrp.svg",
  LINK: "link.svg",
  AVAX: "avax.svg",
  TON: "ton.png",
  DOT: "dot.svg",
  UNI: "uni.svg",
  NEAR: "near.png",
  AAVE: "aave.svg",
  PEPE: "pepe.png",
  WLD: "wld.png",
  TRX: "trx.svg",
  SHIB: "shib.png",
  MNT: "mnt.png",
  USDT: "usdt.svg",
  USDC: "usdc.svg",
  USD1: "usd.svg",
  "USDT-TYB": "usdt.svg",
  DAI: "dai.svg",
  FDUSD: "usd.svg",
  USDE: "usd.svg",
  STABLE: "usd.svg",
};

type Props = {
  symbol: string;
  name?: string;
  className?: string;
};

export function CoinMark({ symbol, name, className }: Props) {
  const file = FILES[symbol];
  const src = file ? `${import.meta.env.BASE_URL}coins/${file}` : null;
  const [broken, setBroken] = useState(false);
  const label = (name ?? symbol).slice(0, 1);

  if (!src || broken) {
    return (
      <span
        className={cn(
          "coin-mark flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-xs",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "coin-mark relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full p-0.5",
        className,
      )}
    >
      <img
        src={src}
        alt=""
        width={40}
        height={40}
        className="size-full object-contain"
        onError={() => setBroken(true)}
      />
    </span>
  );
}
