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
    if (seconds <= 0) return "bg-slate-900/60 border border-slate-800/40 text-slate-500";
    const ratio = seconds / maxSeconds;
    if (ratio > 0.75) return "bg-blue-500 text-white shadow-sm shadow-blue-500/50";
    if (ratio > 0.5) return "bg-blue-600 text-white";
    if (ratio > 0.25) return "bg-blue-800 text-slate-200";
    return "bg-blue-950/80 border border-blue-800/40 text-slate-300";
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Daily Presence Calendar
        </h4>
        <span className="text-[11px] text-slate-400">
          {days.length} days recorded
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-[10px] font-medium text-slate-500 text-center py-0.5"
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
              className={`h-10 rounded-xl flex flex-col items-center justify-center transition-all ${getDayIntensityClass(
                day.activeSeconds
              )} ${isSelected ? "ring-2 ring-white scale-105" : "hover:opacity-90"}`}
            >
              <span className="text-[11px] font-semibold">{dayNumber}</span>
              <span className="text-[9px] opacity-80">
                {day.activeSeconds > 0
                  ? formatDuration(day.activeSeconds)
                  : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/50 rounded-xl p-3 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between text-slate-200">
            <span className="font-semibold">{selectedDay.date}</span>
            <span className="text-blue-400 font-bold">
              {formatDuration(selectedDay.activeSeconds)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Sessions: {selectedDay.sessionCount}</span>
            <span>
              Longest: {formatDuration(selectedDay.longestSessionSeconds)}
            </span>
            <span className="text-emerald-400 font-medium">
              {selectedDay.coverageStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
