"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { ActivityCalendar } from "@/components/activity-calendar";
import { SessionTimeline } from "@/components/session-timeline";
import { EmptyState } from "@/components/empty-state";
import type { DailyActivityPoint, SessionItem } from "@/types";
import { Calendar as CalendarIcon } from "lucide-react";

export default function HistoryPage() {
  const { user, hapticFeedback } = useTelegram();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [calendarDays, setCalendarDays] = useState<DailyActivityPoint[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [daysRange, setDaysRange] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        const res = await fetch(`/api/accounts?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts || []);
          if (data.accounts?.length > 0) {
            setSelectedAccountId(data.accounts[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load accounts:", err);
      }
    };

    fetchAccounts();
  }, [user]);

  useEffect(() => {
    if (!selectedAccountId) return;

    const fetchHistoryData = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date(Date.now() - daysRange * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];

        const [historyRes, sessionsRes] = await Promise.all([
          fetch(
            `/api/accounts/${selectedAccountId}/history?startDate=${startDate}&endDate=${endDate}`
          ),
          fetch(`/api/accounts/${selectedAccountId}/sessions?limit=25`),
        ]);

        if (historyRes.ok) {
          const hData = await historyRes.json();
          setCalendarDays(hData.history || []);
        }
        if (sessionsRes.ok) {
          const sData = await sessionsRes.json();
          setSessions(sData.sessions || []);
        }
      } catch (err) {
        console.error("Failed to load history data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryData();
  }, [selectedAccountId, daysRange]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          📅 Activity History
        </h1>
        <p className="text-xs text-zinc-400 font-medium">
          Calendar presence log & timeline of recorded sessions
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No Tracked Accounts"
          description="Add an account to view its calendar activity history."
          actionText="+ Enroll Account"
          onAction={() => {
            window.location.href = "/accounts";
          }}
        />
      ) : (
        <>
          {/* Account Selector Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    hapticFeedback("light");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border tap-effect ${
                    isSelected
                      ? "bg-blue-500/15 text-blue-400 border-blue-500/30 font-bold"
                      : "bg-[#12151e] text-zinc-400 border-white/[0.06] hover:text-zinc-200"
                  }`}
                >
                  {acc.displayName || "@" + acc.username}
                </button>
              );
            })}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between bg-[#10131d] border border-white/[0.08] p-1 rounded-2xl">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDaysRange(d);
                  hapticFeedback("light");
                }}
                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-xl transition-all tap-effect border ${
                  daysRange === d
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 border-transparent"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Activity Calendar Component */}
          <ActivityCalendar days={calendarDays} />

          {/* Recorded Sessions Timeline */}
          <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Recorded Sessions ({sessions.length})
            </h4>

            <SessionTimeline sessions={sessions} />
          </div>
        </>
      )}
    </div>
  );
}
