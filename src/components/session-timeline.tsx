"use client";

import React from "react";
import type { SessionItem } from "@/types";
import { formatDuration, formatTime } from "@/lib/utils";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface SessionTimelineProps {
  sessions: SessionItem[];
  timezone?: string;
}

export function SessionTimeline({ sessions, timezone = "UTC" }: SessionTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No recorded sessions in this period.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const startTime = formatTime(s.startedAt, timezone);
        const endTime = s.endedAt ? formatTime(s.endedAt, timezone) : "Active now";
        const isHighConfidence = s.confidence === "HIGH";

        return (
          <div
            key={s.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  s.isOpen
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 animate-pulse"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {startTime} — {endTime}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={isHighConfidence ? "text-slate-400" : "text-amber-400"}>
                    {s.confidence} confidence
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-blue-400">
                {formatDuration(s.durationSeconds)}
              </span>
              {s.isOpen && (
                <div className="text-[9px] text-emerald-400 font-medium">
                  Active
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
