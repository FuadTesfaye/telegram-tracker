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
        return "bg-blue-500 shadow-sm shadow-blue-500/50";
      case 3:
        return "bg-blue-600";
      case 2:
        return "bg-blue-800";
      case 1:
        return "bg-blue-950/80 border border-blue-800/40";
      default:
        return "bg-slate-900/80 border border-slate-800/40";
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {title}
        </h4>
        {peakHour !== undefined && (
          <span className="text-[11px] font-medium text-blue-400">
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
              className={`h-9 rounded-lg flex flex-col items-center justify-center transition-all ${getIntensityClass(
                item.intensity
              )} ${isSelected ? "ring-2 ring-white scale-105" : "hover:opacity-90"}`}
            >
              <span className="text-[10px] font-mono text-slate-300">
                {item.hour.toString().padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {selectedHour && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <span>
            Hour:{" "}
            <strong className="text-slate-100 font-mono">
              {selectedHour.hour.toString().padStart(2, "0")}:00 -{" "}
              {((selectedHour.hour + 1) % 24).toString().padStart(2, "0")}:00
            </strong>
          </span>
          <span>
            Observed:{" "}
            <strong className="text-blue-400">
              {formatDuration(selectedHour.activeSeconds)}
            </strong>{" "}
            ({selectedHour.sessionCount} sessions)
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 text-[10px] text-slate-400">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-950 border border-blue-800" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-800" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
        <span>More</span>
      </div>
    </div>
  );
}
