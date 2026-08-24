"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import { formatDuration } from "@/lib/utils";
import type { LeagueCompetitor, LeagueAward } from "@/server/services/league.service";
import {
  Trophy,
  Swords,
  Medal,
  Sparkles,
  Flame,
  Crown,
  ChevronRight,
  ShieldAlert,
  Zap,
  Share2,
  Check,
} from "lucide-react";

export default function LeaguePage() {
  const { user, hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rival" | "awards">("leaderboard");
  const [leaderboardData, setLeaderboardData] = useState<{
    weekNumber: number;
    triumvirateTitle?: string;
    roastOfTheWeek?: string;
    competitors: LeagueCompetitor[];
    awards: LeagueAward[];
    weeklyVictim: LeagueCompetitor | null;
  } | null>(null);
  const [rivalData, setRivalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedRoast, setCopiedRoast] = useState(false);

  const fetchLeague = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [leagueRes, rivalRes] = await Promise.all([
        fetch(`/api/league?userId=${user.id}`),
        fetch(`/api/league/rival?userId=${user.id}`),
      ]);

      if (leagueRes.ok) {
        const lData = await leagueRes.json();
        setLeaderboardData(lData);
      }
      if (rivalRes.ok) {
        const rData = await rivalRes.json();
        setRivalData(rData.rival);
      }
    } catch (err) {
      console.error("Failed to load league:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeague();
  }, [user]);

  const copyRoast = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRoast(true);
    hapticFeedback("medium");
    setTimeout(() => setCopiedRoast(false), 2000);
  };

  if (isLoading || !leaderboardData) {
    return (
      <div className="space-y-4 pt-4 animate-pulse">
        <div className="h-8 bg-slate-900 rounded-xl w-2/3" />
        <div className="h-28 bg-slate-900 rounded-2xl" />
        <div className="h-48 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  const competitors = leaderboardData.competitors || [];
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-1.5">
            🏆 Telegram League
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Week {leaderboardData.weekNumber} Championship • {leaderboardData.triumvirateTitle || "The Blue Council"}
          </p>
        </div>

        <Link
          href="/fun"
          onClick={() => hapticFeedback("light")}
          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Flame className="w-3.5 h-3.5" /> Roast Me
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab("leaderboard");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "leaderboard"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          🏆 Ranks
        </button>
        <button
          onClick={() => {
            setActiveTab("rival");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "rival"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          ⚔️ Rival
        </button>
        <button
          onClick={() => {
            setActiveTab("awards");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "awards"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          🎖 Awards
        </button>
      </div>

      {competitors.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Competitors Enrolled"
          description="Add up to 3 Telegram accounts to join this week's Telegram League!"
          actionText="+ Enroll First Competitor"
          onAction={() => {
            window.location.href = "/accounts";
          }}
        />
      ) : (
        <>
          {/* TAB 1: LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="space-y-3">
              {/* Roast of the Week Card */}
              {leaderboardData.roastOfTheWeek && (
                <div className="p-4 bg-gradient-to-br from-rose-950/70 via-slate-900/90 to-amber-950/60 border border-rose-800/50 rounded-2xl relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> Legendary Roast of the Week
                    </span>
                    <button
                      onClick={() => copyRoast(leaderboardData.roastOfTheWeek!)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg"
                    >
                      {copiedRoast ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                      <span className="text-[10px] font-bold">{copiedRoast ? "Copied" : "Share"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                    {leaderboardData.roastOfTheWeek}
                  </p>
                </div>
              )}

              {/* Crown Banner */}
              {competitors.length > 1 && (
                <div className="p-3 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-800/60 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">👑</span>
                    <div>
                      <span className="text-slate-200 font-bold block">
                        Battle for the Crown
                      </span>
                      <span className="text-[11px] text-blue-300">
                        {competitors[1]?.displayName} is{" "}
                        <strong className="text-white">
                          {competitors[1]?.formattedGapToLeader}
                        </strong>{" "}
                        away from #1!
                      </span>
                    </div>
                  </div>
                  <span className="text-lg animate-bounce">👀</span>
                </div>
              )}

              {/* Competitors List */}
              <div className="space-y-2.5">
                {competitors.map((c, idx) => {
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={c.accountId}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isFirst
                          ? "bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-950/20"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{medals[idx] || "•"}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-100">
                                {c.displayName}
                              </span>
                              {isFirst && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                                  Leader
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-blue-400 font-semibold block mt-0.5">
                              {c.title}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-100 block">
                            {c.formattedDuration}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {c.sessionCount} sessions
                          </span>
                        </div>
                      </div>

                      {/* Stat bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Longest sitting:{" "}
                          <strong className="text-slate-200">
                            {c.formattedLongestSession}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>{c.tier.icon}</span> {c.tier.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RIVAL SHOWDOWN */}
          {activeTab === "rival" && (
            <div className="space-y-4">
              {rivalData ? (
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-rose-400" /> Head-to-Head Showdown
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/50 rounded-lg">
                      Rivalry Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">
                        {rivalData.userAccount?.displayName}
                      </span>
                      <span className="text-base font-black text-blue-400">
                        {rivalData.userAccount?.formattedDuration}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">
                        {rivalData.rivalAccount?.displayName}
                      </span>
                      <span className="text-base font-black text-rose-400">
                        {rivalData.rivalAccount?.formattedDuration}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs font-semibold text-center text-slate-200">
                    {rivalData.statusMessage}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Swords}
                  title="No Rival Designated"
                  description="Enroll at least 2 competitors to unlock live Head-to-Head score gap battles!"
                  actionText="+ Add Another Account"
                  onAction={() => {
                    window.location.href = "/accounts";
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 3: MINI AWARDS */}
          {activeTab === "awards" && (
            <div className="space-y-3">
              {leaderboardData.awards.length === 0 ? (
                <EmptyState
                  icon={Medal}
                  title="Awards Calculating"
                  description="Awards are updated as sessions accumulate throughout the week!"
                />
              ) : (
                leaderboardData.awards.map((award) => (
                  <div
                    key={award.id}
                    className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{award.icon}</span>
                      <div>
                        <span className="text-sm font-bold text-slate-100 block">
                          {award.title}
                        </span>
                        <span className="text-xs text-slate-400">
                          {award.statDescription}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200 block">
                        {award.recipientName}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-900">
                        {award.badge}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
