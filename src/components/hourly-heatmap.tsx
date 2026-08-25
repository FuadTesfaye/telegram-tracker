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
        return "bg-blue-500 text-white font-extrabold border border-blue-400/40";
      case 3:
        return "bg-blue-600 text-white font-bold";
      case 2:
        return "bg-blue-900/90 text-blue-100 font-medium";
      case 1:
        return "bg-blue-950/70 text-blue-300 border border-blue-800/30";
      default:
        return "bg-[#181c28] border border-white/[0.04] text-zinc-500";
    }
  };

  return (
    <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          {title}
        </h4>
        {peakHour !== undefined && (
          <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
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
              className={`h-9 rounded-xl flex flex-col items-center justify-center transition-all tap-effect ${getIntensityClass(
                item.intensity
              )} ${isSelected ? "ring-2 ring-blue-400 scale-105" : "hover:opacity-90"}`}
            >
              <span className="text-[10px] font-mono font-bold">
                {item.hour.toString().padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {selectedHour && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] bg-[#181c28] rounded-xl p-3 flex items-center justify-between text-xs text-zinc-200">
          <span>
            Hour:{" "}
            <strong className="text-zinc-100 font-mono">
              {selectedHour.hour.toString().padStart(2, "0")}:00 -{" "}
              {((selectedHour.hour + 1) % 24).toString().padStart(2, "0")}:00
            </strong>
          </span>
          <span>
            Observed:{" "}
            <strong className="text-blue-400 font-mono tabular-nums">
              {formatDuration(selectedHour.activeSeconds)}
            </strong>{" "}
            <span className="text-zinc-400">({selectedHour.sessionCount} sessions)</span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 text-[10px] text-zinc-400 font-medium font-mono">
        <span>Low</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-[#181c28] border border-white/[0.05]" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-950/70 border border-blue-800/30" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-900/90" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
        <span>Peak</span>
      </div>
    </div>
  );
}
