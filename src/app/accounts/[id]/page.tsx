"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/components/telegram-provider";
import { StatCard } from "@/components/stat-card";
import { HourlyHeatmap } from "@/components/hourly-heatmap";
import { SessionTimeline } from "@/components/session-timeline";
import { formatDuration } from "@/lib/utils";
import type { AccountAnalyticsOverview, SessionItem, HourlyDistribution } from "@/types";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileCode,
  Trash2,
  Pause,
  Play,
  Clock,
  Flame,
  Activity,
  Zap,
} from "lucide-react";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hapticFeedback } = useTelegram();
  const [overview, setOverview] = useState<AccountAnalyticsOverview | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [hourly, setHourly] = useState<HourlyDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, sessionsRes, hourlyRes] = await Promise.all([
        fetch(`/api/accounts/${id}/overview`),
        fetch(`/api/accounts/${id}/sessions?limit=10`),
        fetch(`/api/accounts/${id}/hourly?daysBack=30`),
      ]);

      if (overviewRes.ok) {
        const o = await overviewRes.json();
        setOverview(o.overview);
      }
      if (sessionsRes.ok) {
        const s = await sessionsRes.json();
        setSessions(s.sessions || []);
      }
      if (hourlyRes.ok) {
        const h = await hourlyRes.json();
        setHourly(h.hourly || []);
      }
    } catch (err) {
      console.error("Failed to load account details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const toggleStatus = async () => {
    if (!overview) return;
    try {
      hapticFeedback("light");
      const action = overview.account.trackingStatus === "active" ? "stop" : "resume";
      await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadData();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete this account and all historical tracking data?")) return;
    try {
      hapticFeedback("warning");
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      router.push("/accounts");
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  if (isLoading || !overview) {
    return (
      <div className="space-y-4 pt-4 animate-pulse">
        <div className="h-8 bg-slate-900 rounded-xl w-2/3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-slate-900 rounded-2xl" />
          <div className="h-24 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  const acc = overview.account;
  const isOnline = acc.lastSeenStatus === "online";
  const isActive = acc.trackingStatus === "active";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/accounts"
            onClick={() => hapticFeedback("light")}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <span>{acc.displayName || "@" + acc.username}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
            </h1>
            <p className="text-[11px] text-slate-400">
              Tracked since {new Date(acc.trackingStartedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleStatus}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isActive
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-emerald-950/80 border-emerald-800/80 text-emerald-400"
            }`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={deleteAccount}
            className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:bg-rose-900/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Observed Today"
          value={overview.today.formattedDuration}
          subtitle={`${overview.today.sessionCount} sessions`}
          icon={Clock}
          iconColor="text-blue-400"
        />
        <StatCard
          title="7-Day Total"
          value={overview.sevenDays.formattedDuration}
          subtitle="Observed presence"
          icon={Activity}
          iconColor="text-emerald-400"
        />
        <StatCard
          title="Active Streak"
          value={`${overview.streaks.currentStreakDays} Days`}
          subtitle={`Best: ${overview.streaks.longestStreakDays}d`}
          icon={Flame}
          iconColor="text-amber-400"
        />
        <StatCard
          title="Avg Session"
          value={formatDuration(overview.sevenDays.averageSessionSeconds)}
          subtitle={`Peak hour: ${overview.sevenDays.peakHour}:00`}
          icon={Zap}
          iconColor="text-purple-400"
        />
      </div>

      {/* 24-Hour Intensity Heatmap */}
      <HourlyHeatmap data={hourly} peakHour={overview.sevenDays.peakHour} />

      {/* Recent Sessions */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Recent Sessions
        </h4>
        <SessionTimeline sessions={sessions} />
      </div>

      {/* Export Options */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Export Verified Data
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/api/accounts/${id}/export?format=csv`}
            download
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </a>
          <a
            href={`/api/accounts/${id}/export?format=json`}
            download
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:border-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" /> Export JSON
          </a>
        </div>
      </div>
    </div>
  );
}
