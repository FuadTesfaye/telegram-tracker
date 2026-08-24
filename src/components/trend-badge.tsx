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
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold font-mono tabular-nums ${
        isUp
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : isDown
          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          : "bg-slate-800/60 text-slate-400 border border-slate-700/50"
      }`}
    >
      {isUp && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
      {isDown && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
      {!isUp && !isDown && <Minus className="w-3 h-3 stroke-[2.5]" />}
      <span>{percentage > 0 ? `+${percentage}%` : `${percentage}%`}</span>
      {label && <span className="text-[10px] text-slate-400 font-normal ml-0.5 font-sans">{label}</span>}
    </span>
  );
}
