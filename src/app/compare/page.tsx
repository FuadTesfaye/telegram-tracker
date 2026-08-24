"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import { formatDuration } from "@/lib/utils";
import type { AccountAnalyticsOverview } from "@/types";
import { GitCompare, Users, ArrowRight } from "lucide-react";

export default function ComparePage() {
  const { user, hapticFeedback } = useTelegram();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accA, setAccA] = useState<string>("");
  const [accB, setAccB] = useState<string>("");
  const [dataA, setDataA] = useState<AccountAnalyticsOverview | null>(null);
  const [dataB, setDataB] = useState<AccountAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        const res = await fetch(`/api/accounts?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.accounts || [];
          setAccounts(list);
          if (list.length >= 2) {
            setAccA(list[0].id);
            setAccB(list[1].id);
          } else if (list.length === 1) {
            setAccA(list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load accounts:", err);
      }
    };

    fetchAccounts();
  }, [user]);

  useEffect(() => {
    if (!accA || !accB) return;

    const fetchComparisons = async () => {
      try {
        setIsLoading(true);
        const [resA, resB] = await Promise.all([
          fetch(`/api/accounts/${accA}/overview`),
          fetch(`/api/accounts/${accB}/overview`),
        ]);

        if (resA.ok) {
          const a = await resA.json();
          setDataA(a.overview);
        }
        if (resB.ok) {
          const b = await resB.json();
          setDataB(b.overview);
        }
      } catch (err) {
        console.error("Failed to compare accounts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [accA, accB]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight">
          Compare Accounts
        </h1>
        <p className="text-xs text-slate-400">
          Side-by-side observable presence analysis
        </p>
      </div>

      {accounts.length < 2 ? (
        <EmptyState
          icon={GitCompare}
          title="Need At Least 2 Accounts"
          description="Track at least two Telegram accounts to enable side-by-side presence comparison."
        />
      ) : (
        <>
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Account 1
              </label>
              <select
                value={accA}
                onChange={(e) => {
                  setAccA(e.target.value);
                  hapticFeedback("light");
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName || "@" + a.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Account 2
              </label>
              <select
                value={accB}
                onChange={(e) => {
                  setAccB(e.target.value);
                  hapticFeedback("light");
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName || "@" + a.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dataA && dataB && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pb-3 border-b border-slate-800">
                <span className="font-bold text-blue-400 truncate">
                  {dataA.account.displayName || "@" + dataA.account.username}
                </span>
                <span className="font-semibold text-slate-400 uppercase text-[10px]">
                  Metric
                </span>
                <span className="font-bold text-emerald-400 truncate">
                  {dataB.account.displayName || "@" + dataB.account.username}
                </span>
              </div>

              {/* Rows */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-semibold text-slate-200">
                    {dataA.today.formattedDuration}
                  </span>
                  <span className="text-slate-400 text-[11px]">Today</span>
                  <span className="font-semibold text-slate-200">
                    {dataB.today.formattedDuration}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-semibold text-slate-200">
                    {dataA.sevenDays.formattedDuration}
                  </span>
                  <span className="text-slate-400 text-[11px]">7-Day Total</span>
                  <span className="font-semibold text-slate-200">
                    {dataB.sevenDays.formattedDuration}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-semibold text-slate-200">
                    {dataA.sevenDays.sessionCount}
                  </span>
                  <span className="text-slate-400 text-[11px]">7-Day Sessions</span>
                  <span className="font-semibold text-slate-200">
                    {dataB.sevenDays.sessionCount}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-semibold text-slate-200">
                    {formatDuration(dataA.sevenDays.averageSessionSeconds)}
                  </span>
                  <span className="text-slate-400 text-[11px]">Avg Session</span>
                  <span className="font-semibold text-slate-200">
                    {formatDuration(dataB.sevenDays.averageSessionSeconds)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-semibold text-slate-200">
                    {dataA.sevenDays.peakHour}:00
                  </span>
                  <span className="text-slate-400 text-[11px]">Peak Hour</span>
                  <span className="font-semibold text-slate-200">
                    {dataB.sevenDays.peakHour}:00
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-semibold text-slate-200">
                    {dataA.streaks.currentStreakDays}d
                  </span>
                  <span className="text-slate-400 text-[11px]">Active Streak</span>
                  <span className="font-semibold text-slate-200">
                    {dataB.streaks.currentStreakDays}d
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
