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
} from "lucide-react";

export default function LeaguePage() {
  const { user, hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rival" | "awards" | "hall">("leaderboard");
  const [leaderboardData, setLeaderboardData] = useState<{
    weekNumber: number;
    competitors: LeagueCompetitor[];
    awards: LeagueAward[];
    weeklyVictim: LeagueCompetitor | null;
    prediction?: any;
  } | null>(null);
  const [rivalData, setRivalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            Week {leaderboardData.weekNumber} Championship
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
                          ? "bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-500/10"
                          : "bg-slate-900/60 border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black">
                            {medals[idx] || `${idx + 1}.`}
                          </span>
                          <div>
                            <div className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                              <span>{c.displayName}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {c.tier.icon} {c.tier.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                              {c.title}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-blue-400">
                            {c.formattedDuration}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {c.sessionCount} sessions
                          </div>
                        </div>
                      </div>

                      {/* Longest Session & Distance Bar */}
                      <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Longest Session:{" "}
                          <strong className="text-slate-200">
                            {c.formattedLongestSession}
                          </strong>
                        </span>
                        {!isFirst && (
                          <span className="text-rose-400 font-medium">
                            -{c.formattedGapToLeader} to crown
                          </span>
                        )}
                        {isFirst && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Defending #1
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Midweek Prediction Card */}
              {leaderboardData.prediction && (
                <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-300 font-bold block">
                      Midweek Prophecy
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {leaderboardData.prediction.predictionMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THE RIVAL */}
          {activeTab === "rival" && (
            <div className="space-y-4">
              {!rivalData ? (
                <EmptyState
                  icon={Swords}
                  title="Need at least 2 accounts"
                  description="Add a second account to unlock head-to-head rivalry mode!"
                />
              ) : (
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="text-center flex-1">
                      <span className="text-lg">👑</span>
                      <div className="text-xs font-black text-slate-100 mt-1">
                        {rivalData.userAccount?.displayName}
                      </div>
                      <div className="text-sm font-black text-blue-400">
                        {rivalData.userAccount?.formattedDuration}
                      </div>
                    </div>

                    <div className="px-3 text-center">
                      <span className="text-xs font-black text-rose-500 uppercase">
                        VS
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {rivalData.formattedGap} gap
                      </div>
                    </div>

                    <div className="text-center flex-1">
                      <span className="text-lg">😈</span>
                      <div className="text-xs font-black text-slate-100 mt-1">
                        {rivalData.rivalAccount?.displayName}
                      </div>
                      <div className="text-sm font-black text-emerald-400">
                        {rivalData.rivalAccount?.formattedDuration}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl text-center text-xs font-semibold text-amber-300 border border-amber-900/40">
                    {rivalData.statusMessage}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MINI-AWARDS */}
          {activeTab === "awards" && (
            <div className="grid grid-cols-1 gap-2.5">
              {leaderboardData.awards.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-800/70">
                      {a.icon}
                    </span>
                    <div>
                      <span className="text-xs font-black text-slate-100 block">
                        {a.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Winner: <strong className="text-blue-400">{a.recipientName}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {a.statDescription}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-1 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-xl">
                    {a.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
