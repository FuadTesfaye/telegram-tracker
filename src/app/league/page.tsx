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
  TrendingUp,
  Dices,
  Coins,
} from "lucide-react";

import { useCachedData } from "@/lib/use-cached-data";

export default function LeaguePage() {
  const { user, hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState<
    "leaderboard" | "rival" | "wagers" | "awards"
  >("leaderboard");
  const [copiedRoast, setCopiedRoast] = useState(false);
  const [wagerTarget, setWagerTarget] = useState<string | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number>(250);
  const [lockedWager, setLockedWager] = useState<{
    targetName: string;
    amount: number;
    odds: number;
    potentialWin: number;
  } | null>(null);
  const [copiedWager, setCopiedWager] = useState(false);

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

  const { data: betsResp } = useCachedData<{
    weekNumber: number;
    userPoints: number;
    odds: any[];
  }>(user ? `/api/league/bets?userId=${user.id}` : null, { ttlMs: 20000 });

  const rivalData = rivalResp?.rival || null;
  const betsData = betsResp || null;
  const isLoading = isLeagueLoading && !leaderboardData;

  const fetchLeague = () => {
    refetchLeague();
    refetchRival();
  };

  const handlePlaceWager = (target: any) => {
    hapticFeedback("success");
    const potentialWin = Math.round(wagerAmount * target.odds);
    setLockedWager({
      targetName: target.displayName,
      amount: wagerAmount,
      odds: target.odds,
      potentialWin,
    });
  };

  const copyWager = (wager: any) => {
    hapticFeedback("light");
    const text = `🎲 Telegram League Wager\n\nI locked in ${wager.amount} pts on *${wager.targetName}* to win Week ${leaderboardData?.weekNumber || 35} at ${wager.odds}x odds!\n\n💰 Potential Payout: ${wager.potentialWin} pts\n\n👉 Place your prediction on Telegram League!`;
    navigator.clipboard.writeText(text);
    setCopiedWager(true);
    setTimeout(() => setCopiedWager(false), 2500);
  };

  const copyRoast = (text: string) => {
    hapticFeedback("light");
    navigator.clipboard.writeText(text);
    setCopiedRoast(true);
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all tap-effect border border-sky-400/20"
        >
          <Flame className="w-3.5 h-3.5 fill-white" /> Roast Me
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
              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm font-black"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
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
              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm font-black"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          ⚔️ Rival
        </button>
        <button
          onClick={() => {
            setActiveTab("wagers");
            hapticFeedback("light");
          }}
          className={`flex-1 py-2 rounded-lg transition-all tap-effect ${
            activeTab === "wagers"
              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm font-black"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          🎲 Bets
        </button>
        <button
          onClick={() => {
            setActiveTab("awards");
            hapticFeedback("light");
          }}
          className={`flex-1 py-2 rounded-lg transition-all tap-effect ${
            activeTab === "awards"
              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm font-black"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
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

          {/* TAB 3: WAGERS & PREDICTIONS */}
          {activeTab === "wagers" && (
            <div className="space-y-3">
              {/* Balance Card */}
              <div className="p-4 glass-panel bg-[#111622]/90 border border-sky-500/20 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Coins className="w-5 h-5 stroke-[2.25]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Weekly Wager Balance
                    </span>
                    <span className="text-lg font-black text-slate-100 font-mono tabular-nums">
                      {lockedWager ? 1000 - lockedWager.amount : 1000} <span className="text-xs text-sky-400 font-sans font-bold">PTS</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-black/40 px-2 py-1 rounded-lg border border-white/[0.05]">
                  Week {leaderboardData.weekNumber}
                </span>
              </div>

              {/* Active / Locked Wager Slip */}
              {lockedWager && (
                <div className="p-4 bg-[#131a28] border border-sky-500/30 rounded-2xl space-y-3 shadow-lg animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-sky-400 stroke-[3]" /> Wager Locked In
                    </span>
                    <button
                      onClick={() => copyWager(lockedWager)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-white/[0.05] border border-white/[0.06] px-2.5 py-1 rounded-lg tap-effect"
                    >
                      {copiedWager ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                      <span className="text-[10px] font-bold">{copiedWager ? "Copied" : "Share"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">
                        Predicted Winner: {lockedWager.targetName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Staked: <strong className="font-mono text-slate-200">{lockedWager.amount} pts</strong> @ {lockedWager.odds}x
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Potential Payout</span>
                      <span className="text-sm font-black text-sky-400 font-mono tabular-nums">
                        +{lockedWager.potentialWin} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wager Amount Selector */}
              <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Wager Stake:</span>
                  <span className="font-mono font-bold text-sky-400">{wagerAmount} PTS</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setWagerAmount(amt);
                        hapticFeedback("light");
                      }}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all tap-effect border ${
                        wagerAmount === amt
                          ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm"
                          : "bg-black/30 text-slate-400 border-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      {amt === 1000 ? "ALL-IN" : `${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemetry Odds Board */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Live Telemetry Odds
                </h4>

                {(!betsData?.odds || betsData.odds.length === 0) ? (
                  <EmptyState
                    icon={Dices}
                    title="Odds Calculating"
                    description="Weekly wagers unlock as competitor telemetry aggregates."
                  />
                ) : (
                  betsData.odds.map((oddItem: any) => {
                    const isSelected = wagerTarget === oddItem.displayName;
                    return (
                      <div
                        key={oddItem.accountId}
                        className={`p-3.5 glass-card bg-[#111622]/90 border rounded-2xl transition-all space-y-2 ${
                          isSelected
                            ? "border-sky-500/50 shadow-md"
                            : "border-white/[0.07] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                              <span>{oddItem.displayName}</span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                  oddItem.role === "FAVORITE"
                                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                                    : oddItem.role === "CONTENDER"
                                    ? "bg-white/[0.08] text-slate-300 border border-white/[0.1]"
                                    : "bg-black/40 text-slate-400 border border-white/[0.05]"
                                }`}
                              >
                                {oddItem.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              7d Activity: <strong className="font-mono text-slate-300">{oddItem.formattedDuration}</strong> • {oddItem.impliedProbability}% implied win rate
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-sky-400 font-mono tabular-nums block">
                              {oddItem.odds}x
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium uppercase">
                              Multiplier
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePlaceWager(oddItem)}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all tap-effect border border-sky-400/20 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>Bet {wagerAmount} pts on {oddItem.displayName} (Win +{Math.round(wagerAmount * oddItem.odds)} pts)</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MINI AWARDS */}
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
