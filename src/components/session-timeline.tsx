"use client";

import React from "react";
import type { SessionItem } from "@/types";
import { formatDuration, formatTime } from "@/lib/utils";
import { Clock } from "lucide-react";

interface SessionTimelineProps {
  sessions: SessionItem[];
  timezone?: string;
}

export function SessionTimeline({ sessions, timezone = "UTC" }: SessionTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400 font-medium">
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
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111622]/70 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  s.isOpen
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse"
                    : "bg-white/[0.04] text-slate-300 border-white/[0.06]"
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 font-mono tracking-tight">
                  {startTime} — {endTime}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                  <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={isHighConfidence ? "text-slate-400" : "text-amber-400"}>
                    {s.confidence.toLowerCase()} confidence
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-sky-400 font-mono tabular-nums">
                {formatDuration(s.durationSeconds)}
              </span>
              {s.isOpen && (
                <div className="text-[10px] text-emerald-400 font-bold tracking-wide uppercase mt-0.5">
                  ● Live
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
