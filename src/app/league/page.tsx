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
  Flame,
  Crown,
  Share2,
  Check,
  Zap,
} from "lucide-react";

import { useCachedData } from "@/lib/use-cached-data";

export default function LeaguePage() {
  const { user, hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rival" | "awards">("leaderboard");
  const [copiedRoast, setCopiedRoast] = useState(false);

  const {
    data: leaderboardData,
    isLoading: isLeagueLoading,
    revalidate: refetchLeague,
  } = useCachedData<{
    weekNumber: number;
    triumvirateTitle?: string;
    roastOfTheWeek?: string;
    competitors: LeagueCompetitor[];
    awards: LeagueAward[];
    weeklyVictim: LeagueCompetitor | null;
  }>(user ? `/api/league?userId=${user.id}` : null, { ttlMs: 20000 });

  const { data: rivalResp, revalidate: refetchRival } = useCachedData<{
    rival: any;
  }>(user ? `/api/league/rival?userId=${user.id}` : null, { ttlMs: 20000 });

  const rivalData = rivalResp?.rival || null;
  const isLoading = isLeagueLoading && !leaderboardData;

  const fetchLeague = () => {
    refetchLeague();
    refetchRival();
  };

  const copyRoast = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRoast(true);
    hapticFeedback("medium");
    setTimeout(() => setCopiedRoast(false), 2000);
  };

  if (isLoading || !leaderboardData) {
    return (
      <div className="space-y-4 pt-2 animate-pulse">
        <div className="h-8 bg-white/[0.05] rounded-xl w-2/3" />
        <div className="h-28 bg-white/[0.05] rounded-2xl" />
        <div className="h-48 bg-white/[0.05] rounded-2xl" />
      </div>
    );
  }

  const competitors = leaderboardData.competitors || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-1.5">
            🏆 Telegram League
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Week {leaderboardData.weekNumber} • {leaderboardData.triumvirateTitle || "The Blue Council"}
          </p>
        </div>

        <Link
          href="/fun"
          onClick={() => hapticFeedback("light")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-sm transition-all tap-effect"
        >
          <Flame className="w-3.5 h-3.5 fill-slate-950" /> Roast Me
        </Link>
      </div>

      {/* Clean Segmented Tab Switcher */}
      <div className="flex items-center bg-[#10141e] border border-white/[0.08] p-1 rounded-xl text-xs font-bold shadow-inner">
        <button
          onClick={() => {
            setActiveTab("leaderboard");
            hapticFeedback("light");
          }}
          className={`flex-1 py-2 rounded-lg transition-all tap-effect ${
            activeTab === "leaderboard"
              ? "bg-white/[0.1] text-white shadow-sm font-black"
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
          className={`flex-1 py-2 rounded-lg transition-all tap-effect ${
            activeTab === "rival"
              ? "bg-white/[0.1] text-white shadow-sm font-black"
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
          className={`flex-1 py-2 rounded-lg transition-all tap-effect ${
            activeTab === "awards"
              ? "bg-white/[0.1] text-white shadow-sm font-black"
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
          description="Add up to 3 Telegram accounts to join this week's Telegram League championship!"
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
                <div className="p-4 bg-[#131722]/90 border border-white/[0.08] rounded-2xl relative shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" /> Roast of the Week
                    </span>
                    <button
                      onClick={() => copyRoast(leaderboardData.roastOfTheWeek!)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-white/[0.05] border border-white/[0.06] px-2.5 py-1 rounded-lg tap-effect"
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

              {/* Crown Gap Tracker Banner */}
              {competitors.length > 1 && (
                <div className="p-3.5 bg-[#111622]/80 border border-sky-500/20 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👑</span>
                    <div>
                      <span className="text-slate-200 font-bold block">
                        Battle for the Crown
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {competitors[1]?.displayName} is{" "}
                        <strong className="text-sky-400 font-mono">
                          {competitors[1]?.formattedGapToLeader}
                        </strong>{" "}
                        behind #1!
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-sky-400 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                    LIVE GAP
                  </span>
                </div>
              )}

              {/* Competitors List */}
              <div className="space-y-2.5">
                {competitors.map((c, idx) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  const isThird = idx === 2;

                  const badgeClass = isFirst
                    ? "gold-badge"
                    : isSecond
                    ? "silver-badge"
                    : isThird
                    ? "bronze-badge"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06]";

                  return (
                    <div
                      key={c.accountId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isFirst
                          ? "bg-[#141a27] border-amber-500/30 shadow-lg shadow-amber-950/10"
                          : "bg-[#111622]/80 border-white/[0.07] hover:border-white/[0.14]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-sm ${badgeClass}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-100">
                                {c.displayName}
                              </span>
                              {isFirst && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-400/30">
                                  Crown
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-sky-400 font-semibold block mt-0.5">
                              {c.title}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-100 font-mono tabular-nums block">
                            {c.formattedDuration}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {c.sessionCount} sessions
                          </span>
                        </div>
                      </div>

                      {/* Stat bar */}
                      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>
                          Longest sitting:{" "}
                          <strong className="text-slate-200 font-mono">
                            {c.formattedLongestSession}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>{c.tier.icon}</span> <span className="text-slate-300 font-semibold">{c.tier.name}</span>
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
            <div className="space-y-3">
              {rivalData ? (
                <div className="p-4 bg-[#111622] border border-white/[0.08] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-rose-400" /> Head-to-Head Showdown
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md">
                      Rivalry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06]">
                      <span className="text-xs text-slate-400 font-medium block mb-1">
                        {rivalData.userAccount?.displayName}
                      </span>
                      <span className="text-lg font-black text-sky-400 font-mono tabular-nums">
                        {rivalData.userAccount?.formattedDuration}
                      </span>
                    </div>

                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06]">
                      <span className="text-xs text-slate-400 font-medium block mb-1">
                        {rivalData.rivalAccount?.displayName}
                      </span>
                      <span className="text-lg font-black text-rose-400 font-mono tabular-nums">
                        {rivalData.rivalAccount?.formattedDuration}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.05] text-xs font-medium text-center text-slate-200">
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
            <div className="space-y-2.5">
              {leaderboardData.awards.length === 0 ? (
                <EmptyState
                  icon={Medal}
                  title="Awards Calculating"
                  description="Superlative awards update in real time as sessions accumulate throughout the week!"
                />
              ) : (
                leaderboardData.awards.map((award) => (
                  <div
                    key={award.id}
                    className="p-3.5 bg-[#111622] border border-white/[0.07] rounded-2xl flex items-center justify-between hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{award.icon}</span>
                      <div>
                        <span className="text-sm font-bold text-slate-100 block">
                          {award.title}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {award.statDescription}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200 block">
                        {award.recipientName}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
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
