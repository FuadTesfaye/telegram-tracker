import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  percentage: number;
  direction: "up" | "down" | "neutral";
  label?: string;
}

export function TrendBadge({ percentage, direction, label }: TrendBadgeProps) {
  const isUp = direction === "up";
  const isDown = direction === "down";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold font-mono tabular-nums ${
        isUp
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : isDown
          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          : "bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
      }`}
    >
      {isUp && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
      {isDown && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
      {!isUp && !isDown && <Minus className="w-3 h-3 stroke-[2.5]" />}
      <span>{percentage > 0 ? `+${percentage}%` : `${percentage}%`}</span>
      {label && <span className="text-[10px] text-zinc-400 font-medium ml-0.5 font-sans">{label}</span>}
    </span>
  );
}
