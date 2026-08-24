"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/telegram-provider";
import { StatCard } from "@/components/stat-card";
import { TrendBadge } from "@/components/trend-badge";
import { EmptyState } from "@/components/empty-state";
import { SessionTimeline } from "@/components/session-timeline";
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
} from "lucide-react";

export default function HomePage() {
  const { user, isLoading: isAuthLoading, hapticFeedback } = useTelegram();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AccountAnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  useEffect(() => {
    if (!selectedAccountId) return;

    const fetchAccountData = async () => {
      try {
        const [overviewRes, sessionsRes] = await Promise.all([
          fetch(`/api/accounts/${selectedAccountId}/overview`),
          fetch(`/api/accounts/${selectedAccountId}/sessions?limit=5`),
        ]);

        if (overviewRes.ok) {
          const oData = await overviewRes.json();
          setOverview(oData.overview);
        }
        if (sessionsRes.ok) {
          const sData = await sessionsRes.json();
          setRecentSessions(sData.sessions || []);
        }
      } catch (err) {
        console.error("Failed to load account overview:", err);
      }
    };

    fetchAccountData();
  }, [selectedAccountId]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-4 pt-2 animate-pulse">
        <div className="h-8 bg-white/[0.05] rounded-xl w-1/2" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-white/[0.05] rounded-2xl" />
          <div className="h-28 bg-white/[0.05] rounded-2xl" />
        </div>
        <div className="h-44 bg-white/[0.05] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            Telegram League
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
              {user?.plan || "free"}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Activity Analytics & Weekly Championship</p>
        </div>

        <Link
          href="/accounts"
          onClick={() => hapticFeedback("light")}
          className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm transition-all tap-effect border border-sky-400/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </div>

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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border tap-effect ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm"
                      : "bg-[#111622]/80 text-slate-400 border-white/[0.06] hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                    }`}
                  />
                  <span>{acc.displayName || "@" + acc.username}</span>
                </button>
              );
            })}
          </div>

          {/* Master Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
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
              iconColor="text-amber-400"
            />
            <StatCard
              title="7-Day Total"
              value={overview?.sevenDays.formattedDuration || "0m"}
              subtitle="Observed screen time"
              icon={Activity}
              iconColor="text-emerald-400"
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
              iconColor="text-cyan-400"
            />
          </div>

          {/* Anomaly Alert Banner if present */}
          {overview?.anomalies && overview.anomalies.length > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
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
          <div className="glass-panel bg-[#10141e]/85 border border-white/[0.08] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
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
      <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Activity is based on observable Telegram presence. Telemetr does not access private messages, chats, or personal device telemetry.
        </span>
      </div>
    </div>
  );
}
