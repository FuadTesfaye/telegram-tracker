"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { ActivityCalendar } from "@/components/activity-calendar";
import { SessionTimeline } from "@/components/session-timeline";
import { EmptyState } from "@/components/empty-state";
import type { DailyActivityPoint, SessionItem } from "@/types";
import { Calendar as CalendarIcon, Clock, Shield } from "lucide-react";

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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight">
          Activity History
        </h1>
        <p className="text-xs text-slate-400">
          Calendar overview & timeline of recorded presence
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No Tracked Accounts"
          description="Add an account to view its calendar activity history."
        />
      ) : (
        <>
          {/* Account Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    hapticFeedback("light");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-blue-600/20 text-blue-400 border-blue-500/60"
                      : "bg-slate-900/60 text-slate-400 border-slate-800"
                  }`}
                >
                  {acc.displayName || "@" + acc.username}
                </button>
              );
            })}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDaysRange(d);
                  hapticFeedback("light");
                }}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                  daysRange === d
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          {/* Activity Calendar Component */}
          <ActivityCalendar days={calendarDays} />

          {/* Recorded Sessions Timeline */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Recorded Sessions ({sessions.length})
              </h4>
            </div>

            <SessionTimeline sessions={sessions} />
          </div>
        </>
      )}
    </div>
  );
}
