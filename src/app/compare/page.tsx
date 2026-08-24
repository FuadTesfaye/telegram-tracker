"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import { formatDuration } from "@/lib/utils";
import type { AccountAnalyticsOverview } from "@/types";
import { GitCompare } from "lucide-react";

import { useCachedData } from "@/lib/use-cached-data";

export default function ComparePage() {
  const { user, hapticFeedback } = useTelegram();
  const [accA, setAccA] = useState<string>("");
  const [accB, setAccB] = useState<string>("");

  const { data: accountsData } = useCachedData<{ accounts: any[] }>(
    user ? `/api/accounts?userId=${user.id}` : null,
    { ttlMs: 20000 }
  );

  const accounts = accountsData?.accounts || [];

  useEffect(() => {
    if (accounts.length >= 2 && (!accA || !accB)) {
      setAccA(accounts[0].id);
      setAccB(accounts[1].id);
    } else if (accounts.length === 1 && !accA) {
      setAccA(accounts[0].id);
    }
  }, [accounts, accA, accB]);

  const { data: resAData, isLoading: isLoadingA } = useCachedData<{ overview: AccountAnalyticsOverview }>(
    accA ? `/api/accounts/${accA}/overview` : null,
    { ttlMs: 20000 }
  );

  const { data: resBData, isLoading: isLoadingB } = useCachedData<{ overview: AccountAnalyticsOverview }>(
    accB ? `/api/accounts/${accB}/overview` : null,
    { ttlMs: 20000 }
  );

  const dataA = resAData?.overview || null;
  const dataB = resBData?.overview || null;
  const isLoading = (isLoadingA && !dataA) || (isLoadingB && !dataB);


  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          ⚔️ Compare Accounts
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Side-by-side observable presence analysis
        </p>
      </div>

      {accounts.length < 2 ? (
        <EmptyState
          icon={GitCompare}
          title="Need At Least 2 Accounts"
          description="Track at least two Telegram accounts to enable side-by-side presence comparison."
          actionText="+ Enroll Competitors"
          onAction={() => {
            window.location.href = "/accounts";
          }}
        />
      ) : (
        <>
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Account A
              </label>
              <select
                value={accA}
                onChange={(e) => {
                  setAccA(e.target.value);
                  hapticFeedback("light");
                }}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName || "@" + a.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Account B
              </label>
              <select
                value={accB}
                onChange={(e) => {
                  setAccB(e.target.value);
                  hapticFeedback("light");
                }}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
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
            <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pb-3 border-b border-white/[0.06]">
                <span className="font-bold text-sky-400 truncate">
                  {dataA.account.displayName || "@" + dataA.account.username}
                </span>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Metric
                </span>
                <span className="font-bold text-sky-400 truncate">
                  {dataB.account.displayName || "@" + dataB.account.username}
                </span>
              </div>

              {/* Rows */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-mono font-bold text-slate-100">
                    {dataA.today.formattedDuration}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Observed Today</span>
                  <span className="font-mono font-bold text-slate-100">
                    {dataB.today.formattedDuration}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-mono font-bold text-slate-100">
                    {dataA.sevenDays.formattedDuration}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">7-Day Total</span>
                  <span className="font-mono font-bold text-slate-100">
                    {dataB.sevenDays.formattedDuration}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-mono font-bold text-slate-100">
                    {dataA.sevenDays.sessionCount}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">7-Day Sessions</span>
                  <span className="font-mono font-bold text-slate-100">
                    {dataB.sevenDays.sessionCount}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-mono font-bold text-slate-100">
                    {formatDuration(dataA.sevenDays.averageSessionSeconds)}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Avg Session</span>
                  <span className="font-mono font-bold text-slate-100">
                    {formatDuration(dataB.sevenDays.averageSessionSeconds)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-mono font-bold text-slate-100">
                    {dataA.sevenDays.peakHour}:00
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Peak Hour</span>
                  <span className="font-mono font-bold text-slate-100">
                    {dataB.sevenDays.peakHour}:00
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center py-1">
                  <span className="font-mono font-bold text-slate-100">
                    {dataA.streaks.currentStreakDays}d
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Active Streak</span>
                  <span className="font-mono font-bold text-slate-100">
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
