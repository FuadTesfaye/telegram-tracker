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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isUp
          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
          : isDown
          ? "bg-rose-950/60 text-rose-400 border border-rose-800/60"
          : "bg-slate-800 text-slate-400 border border-slate-700"
      }`}
    >
      {isUp && <TrendingUp className="w-3 h-3" />}
      {isDown && <TrendingDown className="w-3 h-3" />}
      {!isUp && !isDown && <Minus className="w-3 h-3" />}
      {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
      {label && <span className="text-[10px] text-slate-400 font-normal ml-0.5">{label}</span>}
    </span>
  );
}
