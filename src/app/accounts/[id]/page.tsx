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
      <div className="space-y-4 pt-2 animate-pulse">
        <div className="h-8 bg-white/[0.04] rounded-2xl w-2/3" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-24 bg-white/[0.04] rounded-2xl" />
          <div className="h-24 bg-white/[0.04] rounded-2xl" />
        </div>
      </div>
    );
  }

  const acc = overview.account;
  const isOnline = acc.lastSeenStatus === "online";
  const isActive = acc.trackingStatus === "active";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/accounts"
            onClick={() => hapticFeedback("light")}
            className="p-2 rounded-xl bg-[#12151e] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 tap-effect"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>{acc.displayName || "@" + acc.username}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-400" : "bg-zinc-600"
                }`}
              />
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              Tracked since {new Date(acc.trackingStartedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleStatus}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all tap-effect ${
              isActive
                ? "bg-[#12151e] border-white/[0.08] text-zinc-300 hover:border-white/[0.14]"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={deleteAccount}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all tap-effect"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
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
          subtitle={`Peak: ${overview.sevenDays.peakHour}:00`}
          icon={Zap}
          iconColor="text-purple-400"
        />
      </div>

      {/* 24-Hour Intensity Heatmap */}
      <HourlyHeatmap data={hourly} peakHour={overview.sevenDays.peakHour} />

      {/* Recent Sessions */}
      <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Recent Sessions
        </h4>
        <SessionTimeline sessions={sessions} />
      </div>

      {/* Export Options */}
      <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Export Telemetry Data
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/api/accounts/${id}/export?format=csv`}
            download
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#181c28] border border-white/[0.08] rounded-xl text-xs font-bold text-zinc-200 hover:border-white/[0.14] transition-all tap-effect"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </a>
          <a
            href={`/api/accounts/${id}/export?format=json`}
            download
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#181c28] border border-white/[0.08] rounded-xl text-xs font-bold text-zinc-200 hover:border-white/[0.14] transition-all tap-effect"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" /> Export JSON
          </a>
        </div>
      </div>
    </div>
  );
}
