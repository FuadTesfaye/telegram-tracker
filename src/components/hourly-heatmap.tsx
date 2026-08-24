"use client";

import React, { useState } from "react";
import type { HourlyDistribution } from "@/types";
import { formatDuration } from "@/lib/utils";

interface HourlyHeatmapProps {
  data: HourlyDistribution[];
  title?: string;
  peakHour?: number;
}

export function HourlyHeatmap({
  data,
  title = "24-Hour Activity Intensity",
  peakHour,
}: HourlyHeatmapProps) {
  const [selectedHour, setSelectedHour] = useState<HourlyDistribution | null>(
    null
  );

  const getIntensityClass = (intensity: number) => {
    switch (intensity) {
      case 4:
        return "bg-sky-400 text-slate-950 font-black shadow-sm shadow-sky-400/30";
      case 3:
        return "bg-sky-500 text-slate-950 font-bold";
      case 2:
        return "bg-sky-700 text-sky-100 font-medium";
      case 1:
        return "bg-sky-950/90 text-sky-300 border border-sky-800/40";
      default:
        return "bg-black/40 border border-white/[0.04] text-slate-500";
    }
  };

  return (
    <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {title}
        </h4>
        {peakHour !== undefined && (
          <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
            Peak: {peakHour.toString().padStart(2, "0")}:00
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {data.map((item) => {
          const isSelected = selectedHour?.hour === item.hour;
          return (
            <button
              key={item.hour}
              onClick={() => setSelectedHour(item)}
              className={`h-9 rounded-lg flex flex-col items-center justify-center transition-all tap-effect ${getIntensityClass(
                item.intensity
              )} ${isSelected ? "ring-2 ring-white scale-105" : "hover:opacity-90"}`}
            >
              <span className="text-[10px] font-mono font-bold">
                {item.hour.toString().padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {selectedHour && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] bg-black/40 rounded-xl p-3 flex items-center justify-between text-xs text-slate-200">
          <span>
            Hour:{" "}
            <strong className="text-slate-100 font-mono">
              {selectedHour.hour.toString().padStart(2, "0")}:00 -{" "}
              {((selectedHour.hour + 1) % 24).toString().padStart(2, "0")}:00
            </strong>
          </span>
          <span>
            Observed:{" "}
            <strong className="text-sky-400 font-mono tabular-nums">
              {formatDuration(selectedHour.activeSeconds)}
            </strong>{" "}
            <span className="text-slate-400">({selectedHour.sessionCount} sessions)</span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 text-[10px] text-slate-400 font-medium font-mono">
        <span>Low</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-black/40 border border-white/[0.05]" />
        <div className="w-2.5 h-2.5 rounded-sm bg-sky-950 border border-sky-800/50" />
        <div className="w-2.5 h-2.5 rounded-sm bg-sky-700" />
        <div className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
        <div className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
        <span>Peak</span>
      </div>
    </div>
  );
}
