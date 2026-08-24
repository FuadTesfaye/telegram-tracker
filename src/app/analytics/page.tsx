"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { HourlyHeatmap } from "@/components/hourly-heatmap";
import { StatCard } from "@/components/stat-card";
import { TrendBadge } from "@/components/trend-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDuration } from "@/lib/utils";
import type { AccountAnalyticsOverview, HourlyDistribution } from "@/types";
import {
  BarChart3,
  Moon,
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user, hapticFeedback } = useTelegram();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AccountAnalyticsOverview | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyDistribution[]>([]);
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

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [overviewRes, hourlyRes] = await Promise.all([
          fetch(`/api/accounts/${selectedAccountId}/overview`),
          fetch(`/api/accounts/${selectedAccountId}/hourly?daysBack=30`),
        ]);

        if (overviewRes.ok) {
          const oData = await overviewRes.json();
          setOverview(oData.overview);
        }
        if (hourlyRes.ok) {
          const hData = await hourlyRes.json();
          setHourlyData(hData.hourly || []);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedAccountId]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight">
          Activity Intelligence
        </h1>
        <p className="text-xs text-slate-400">
          Statistical presence patterns, quiet hours & records
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Accounts Tracked"
          description="Add an account to begin computing presence patterns and heatmaps."
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

          {/* 24-Hour Intensity Heatmap */}
          <HourlyHeatmap
            data={hourlyData}
            peakHour={overview?.sevenDays.peakHour}
          />

          {/* Quiet Hours & Records */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Quiet Window"
              value={`${overview?.quietHours.startHour.toString().padStart(2, "0")}:00 - ${overview?.quietHours.endHour.toString().padStart(2, "0")}:00`}
              subtitle="Consistently lowest activity"
              icon={Moon}
              iconColor="text-indigo-400"
            />
            <StatCard
              title="Longest Session"
              value={formatDuration(overview?.personalBests.longestSessionSeconds || 0)}
              subtitle="Personal best"
              icon={Trophy}
              iconColor="text-amber-400"
            />
            <StatCard
              title="Peak Day Activity"
              value={formatDuration(overview?.personalBests.highestDailyActivitySeconds || 0)}
              subtitle={overview?.personalBests.highestDailyDate || "Recent"}
              icon={Zap}
              iconColor="text-emerald-400"
            />
            <StatCard
              title="Current Streak"
              value={`${overview?.streaks.currentStreakDays || 0} Days`}
              subtitle={`Longest: ${overview?.streaks.longestStreakDays || 0}d`}
              icon={Flame}
              iconColor="text-rose-400"
            />
          </div>

          {/* Period Comparisons */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Period Trend Analysis
            </h4>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  7-Day Rolling Trend
                </div>
                <div className="text-[10px] text-slate-400">
                  Compared with previous 7-day period
                </div>
              </div>
              {overview && (
                <TrendBadge
                  percentage={overview.weeklyTrend.changePercentage}
                  direction={overview.weeklyTrend.direction}
                />
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  30-Day Total Presence
                </div>
                <div className="text-[10px] text-slate-400">
                  Coverage: {overview?.thirtyDays.coverageStatus}
                </div>
              </div>
              <div className="text-xs font-bold text-blue-400">
                {overview?.thirtyDays.formattedDuration}
              </div>
            </div>
          </div>

          {/* Data Semantics Card */}
          <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              All metrics are calculated deterministically from recorded presence
              sessions. Telemetr does not make psychological or behavioral inferences.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
