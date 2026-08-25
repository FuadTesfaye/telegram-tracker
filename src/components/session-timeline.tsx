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
      <div className="text-center py-6 text-xs text-zinc-400 font-medium">
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
            className="flex items-center justify-between p-3 rounded-xl bg-[#141824] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  s.isOpen
                    ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/30"
                    : "bg-white/[0.04] text-zinc-300 border-white/[0.06]"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100 font-mono tracking-tight">
                  {startTime} — {endTime}
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5 font-medium">
                  <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={isHighConfidence ? "text-zinc-400" : "text-amber-400"}>
                    {s.confidence.toLowerCase()} confidence
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-blue-400 font-mono tabular-nums block">
                {formatDuration(s.durationSeconds)}
              </span>
              {s.isOpen && (
                <div className="text-[10px] font-mono text-emerald-400 font-bold tracking-wide uppercase mt-0.5 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
