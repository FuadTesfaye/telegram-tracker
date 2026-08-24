"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/telegram-provider";
import { StatCard } from "@/components/stat-card";
import { TrendBadge } from "@/components/trend-badge";
import { EmptyState } from "@/components/empty-state";
import { SessionTimeline } from "@/components/session-timeline";
import { useCachedData } from "@/lib/use-cached-data";
import { formatDuration } from "@/lib/utils";
import type { AccountAnalyticsOverview, SessionItem } from "@/types";
import {
  Activity,
  Clock,
  Flame,
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trophy,
  Swords,
  Sparkles,
  PieChart,
  Dices,
  Coins,
} from "lucide-react";

export default function HomePage() {
  const { user, isLoading: isAuthLoading, hapticFeedback } = useTelegram();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Instant SWR-cached account list
  const {
    data: accountsData,
    isLoading: isAccountsLoading,
  } = useCachedData<{ accounts: any[] }>(
    user ? `/api/accounts?userId=${user.id}` : null,
    { ttlMs: 20000 }
  );

  const accounts = accountsData?.accounts || [];

  // Auto-select first account on initial mount
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Instant SWR-cached account telemetry overview
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
  } = useCachedData<{ overview: AccountAnalyticsOverview }>(
    selectedAccountId ? `/api/accounts/${selectedAccountId}/overview` : null,
    { ttlMs: 15000 }
  );

  // Instant SWR-cached sessions
  const { data: sessionsData } = useCachedData<{ sessions: SessionItem[] }>(
    selectedAccountId ? `/api/accounts/${selectedAccountId}/sessions?limit=5` : null,
    { ttlMs: 15000 }
  );

  const overview = overviewData?.overview || null;
  const recentSessions = sessionsData?.sessions || [];

  if (isAuthLoading || (isAccountsLoading && accounts.length === 0)) {
    return (
      <div className="space-y-3 pt-2 animate-pulse">
        <div className="h-8 bg-white/[0.04] rounded-xl w-3/4" />
        <div className="grid grid-cols-4 gap-2">
          <div className="h-16 bg-white/[0.04] rounded-xl" />
          <div className="h-16 bg-white/[0.04] rounded-xl" />
          <div className="h-16 bg-white/[0.04] rounded-xl" />
          <div className="h-16 bg-white/[0.04] rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-24 bg-white/[0.04] rounded-xl" />
          <div className="h-24 bg-white/[0.04] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            Telegram League
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md">
              {user?.plan || "free"}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-medium">Activity Telemetry & Weekly Championship</p>
        </div>

        <Link
          href="/accounts"
          onClick={() => hapticFeedback("light")}
          className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors tap-effect border border-sky-400/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </div>

      {/* Quick Access Action Bar */}
      <div className="grid grid-cols-4 gap-2">
        <Link
          href="/league"
          onClick={() => hapticFeedback("light")}
          className="bg-[#11151f] border border-white/[0.08] hover:border-sky-500/30 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 transition-colors tap-effect"
        >
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-200">League</span>
        </Link>

        <Link
          href="/fun"
          onClick={() => hapticFeedback("light")}
          className="bg-[#11151f] border border-white/[0.08] hover:border-sky-500/30 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 transition-colors tap-effect"
        >
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-200">Roast Hub</span>
        </Link>

        <Link
          href="/compare"
          onClick={() => hapticFeedback("light")}
          className="bg-[#11151f] border border-white/[0.08] hover:border-sky-500/30 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 transition-colors tap-effect"
        >
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
            <Swords className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-200">Rival Gap</span>
        </Link>

        <Link
          href="/my"
          onClick={() => hapticFeedback("light")}
          className="bg-[#11151f] border border-white/[0.08] hover:border-sky-500/30 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 transition-colors tap-effect"
        >
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
            <PieChart className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-200">Footprint</span>
        </Link>
      </div>

      {/* Weekly Predictions & Wagers Banner */}
      <Link
        href="/league"
        onClick={() => hapticFeedback("light")}
        className="bg-[#11151f] border border-sky-500/20 hover:border-sky-500/40 p-3 rounded-xl flex items-center justify-between transition-colors tap-effect"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
            <Dices className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-100 block">
              Week 35 Predictions & Wagers
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              1,000 PTS balance • Lock in champion odds
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-sky-400">
          <span>Wager</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </Link>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Tracked Accounts Yet"
          description="Add up to 3 Telegram accounts to begin monitoring observed presence and participate in weekly leagues."
          actionText="+ Enroll First Account"
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
              const isOnline = acc.lastSeenStatus === "online";
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    hapticFeedback("light");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border tap-effect ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      : "bg-[#11151f] text-zinc-400 border-white/[0.06] hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  <span>{acc.displayName || "@" + acc.username}</span>
                </button>
              );
            })}
          </div>

          {/* Master Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              title="Observed Today"
              value={overview?.today.formattedDuration || "0m"}
              subtitle={`${overview?.today.sessionCount || 0} active sessions`}
              icon={Clock}
              iconColor="text-sky-400"
            />
            <StatCard
              title="7-Day Streak"
              value={`${overview?.streaks.currentStreakDays || 0}d`}
              subtitle={`Best: ${overview?.streaks.longestStreakDays || 0} days`}
              icon={Flame}
              iconColor="text-sky-400"
            />
            <StatCard
              title="7-Day Total"
              value={overview?.sevenDays.formattedDuration || "0m"}
              subtitle="Observed screen time"
              icon={Activity}
              iconColor="text-sky-400"
              extra={
                overview && (
                  <TrendBadge
                    percentage={overview.weeklyTrend.changePercentage}
                    direction={overview.weeklyTrend.direction}
                    label="vs last week"
                  />
                )
              }
            />
            <StatCard
              title="Avg Session"
              value={formatDuration(
                overview?.today.averageSessionSeconds ||
                  overview?.sevenDays.averageSessionSeconds ||
                  0
              )}
              subtitle={`Peak: ${overview?.sevenDays.peakHour || 0}:00`}
              icon={Zap}
              iconColor="text-sky-400"
            />
          </div>

          {/* Anomaly Alert Banner if present */}
          {overview?.anomalies && overview.anomalies.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <span className="text-amber-400 text-sm">⚠️</span>
              <div>
                <strong className="font-semibold block text-amber-300">
                  Unusual Activity Detected
                </strong>
                <p className="text-[11px] text-amber-300/80 mt-0.5 font-medium">
                  {overview.anomalies[0].description}
                </p>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="bg-[#11151f] border border-white/[0.08] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Recent Sessions
              </h4>
              <Link
                href="/history"
                onClick={() => hapticFeedback("light")}
                className="text-[11px] font-semibold text-sky-400 flex items-center gap-1 hover:text-sky-300 transition-colors"
              >
                Full History <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </Link>
            </div>

            <SessionTimeline sessions={recentSessions} />
          </div>
        </>
      )}

      {/* Honest Data Privacy Note */}
      <div className="p-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center gap-2 text-[11px] text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
        <span>
          Activity is based on observable Telegram presence. Telemetr does not access private messages, chats, or personal device telemetry.
        </span>
      </div>
    </div>
  );
}
