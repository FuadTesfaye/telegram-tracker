"use client";

import React, { useState } from "react";
import type { DailyActivityPoint } from "@/types";
import { formatDuration } from "@/lib/utils";

interface ActivityCalendarProps {
  days: DailyActivityPoint[];
  onSelectDay?: (day: DailyActivityPoint) => void;
}

export function ActivityCalendar({ days, onSelectDay }: ActivityCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DailyActivityPoint | null>(
    days.length > 0 ? days[days.length - 1] : null
  );

  const maxSeconds = Math.max(
    1,
    ...days.map((d) => d.activeSeconds || 0)
  );

  const getDayIntensityClass = (seconds: number) => {
    if (seconds <= 0) return "bg-black/30 border border-white/[0.04] text-slate-500";
    const ratio = seconds / maxSeconds;
    if (ratio > 0.75) return "bg-sky-500 text-slate-950 font-black shadow-sm shadow-sky-500/30";
    if (ratio > 0.5) return "bg-sky-600 text-white font-bold";
    if (ratio > 0.25) return "bg-sky-900 text-sky-200";
    return "bg-sky-950/80 border border-sky-800/40 text-sky-300";
  };

  return (
    <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Daily Presence Calendar
        </h4>
        <span className="text-[11px] font-mono text-slate-400 font-semibold">
          {days.length} days recorded
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-[10px] font-mono font-bold text-slate-500 text-center py-0.5"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const isSelected = selectedDay?.date === day.date;
          const dayNumber = parseInt(day.date.split("-")[2], 10);

          return (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDay(day);
                if (onSelectDay) onSelectDay(day);
              }}
              className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all tap-effect ${getDayIntensityClass(
                day.activeSeconds
              )} ${isSelected ? "ring-2 ring-white scale-105" : "hover:opacity-90"}`}
            >
              <span className="text-[11px] font-bold font-mono">{dayNumber}</span>
              <span className="text-[8px] font-mono opacity-90">
                {day.activeSeconds > 0
                  ? formatDuration(day.activeSeconds)
                  : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] bg-black/40 rounded-xl p-3.5 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between text-slate-200">
            <span className="font-bold font-mono">{selectedDay.date}</span>
            <span className="text-sky-400 font-black font-mono tabular-nums">
              {formatDuration(selectedDay.activeSeconds)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mt-1">
            <span>Sessions: <strong className="text-slate-200 font-mono">{selectedDay.sessionCount}</strong></span>
            <span>
              Longest: <strong className="text-slate-200 font-mono">{formatDuration(selectedDay.longestSessionSeconds)}</strong>
            </span>
            <span className="text-emerald-400 font-bold uppercase text-[9px] px-1.5 py-0.5 bg-emerald-500/10 rounded-md">
              {selectedDay.coverageStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
