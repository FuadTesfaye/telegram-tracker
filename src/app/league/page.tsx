"use client";

import React, { useState } from "react";
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
      <div className="space-y-3 pt-2 animate-pulse">
        <div className="h-8 bg-white/[0.04] rounded-xl w-2/3" />
        <div className="h-24 bg-white/[0.04] rounded-xl" />
        <div className="h-44 bg-white/[0.04] rounded-xl" />
      </div>
    );
  }

  const competitors = leaderboardData.competitors || [];

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
            🏆 Telegram League
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Week {leaderboardData.weekNumber} • {leaderboardData.triumvirateTitle || "The Obsidian Council"}
          </p>
        </div>

        <Link
          href="/fun"
          onClick={() => hapticFeedback("light")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all tap-effect border border-blue-400/20 shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 fill-white" /> Roast Me
        </Link>
      </div>

      {/* Clean Segmented Tab Switcher */}
      <div className="flex items-center bg-[#10131d] border border-white/[0.08] p-1 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab("leaderboard");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all tap-effect ${
            activeTab === "leaderboard"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
          }`}
        >
          🏆 Ranks
        </button>
        <button
          onClick={() => {
            setActiveTab("rival");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all tap-effect ${
            activeTab === "rival"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
          }`}
        >
          ⚔️ Rival
        </button>
        <button
          onClick={() => {
            setActiveTab("wagers");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all tap-effect ${
            activeTab === "wagers"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
          }`}
        >
          🎲 Bets
        </button>
        <button
          onClick={() => {
            setActiveTab("awards");
            hapticFeedback("light");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all tap-effect ${
            activeTab === "awards"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
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
            <div className="space-y-2.5">
              {/* Roast of the Week Card */}
              {leaderboardData.roastOfTheWeek && (
                <div className="p-3.5 bg-[#12151e] border border-white/[0.08] rounded-2xl relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" /> Roast of the Week
                    </span>
                    <button
                      onClick={() => copyRoast(leaderboardData.roastOfTheWeek!)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg tap-effect"
                    >
                      {copiedRoast ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                      <span className="text-[10px] font-bold">{copiedRoast ? "Copied" : "Share"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium whitespace-pre-line">
                    {leaderboardData.roastOfTheWeek}
                  </p>
                </div>
              )}

              {/* Crown Gap Tracker Banner */}
              {competitors.length > 1 && (
                <div className="p-3.5 bg-[#12151e] border border-amber-500/25 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👑</span>
                    <div>
                      <span className="text-zinc-200 font-bold block">
                        Battle for the Crown
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {competitors[1]?.displayName} is{" "}
                        <strong className="text-amber-400 font-mono">
                          {competitors[1]?.formattedGapToLeader}
                        </strong>{" "}
                        behind #1
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    LIVE GAP
                  </span>
                </div>
              )}

              {/* Competitors List */}
              <div className="space-y-2">
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
                    : "bg-white/[0.04] text-zinc-400 border border-white/[0.06]";

                  return (
                    <div
                      key={c.accountId}
                      className="p-3.5 rounded-2xl border border-white/[0.08] bg-[#12151e] hover:border-white/[0.14] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${badgeClass}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-zinc-100">
                                {c.displayName}
                              </span>
                              {c.label && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.06]">
                                  {c.label}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-medium">
                              {c.title}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-zinc-100 font-mono tabular-nums block">
                            {c.formattedDuration}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium font-mono">
                            {c.sessionCount} sessions
                          </span>
                        </div>
                      </div>

                      {/* Micro stats strip */}
                      <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-white/[0.05] text-center text-[10px]">
                        <div className="bg-[#181c28] p-1.5 rounded-xl border border-white/[0.04]">
                          <span className="text-zinc-400 block font-medium">Longest</span>
                          <span className="font-mono font-bold text-zinc-200">
                            {c.formattedLongestSession}
                          </span>
                        </div>
                        <div className="bg-[#181c28] p-1.5 rounded-xl border border-white/[0.04]">
                          <span className="text-zinc-400 block font-medium">Tier</span>
                          <span className="font-bold text-blue-400">
                            {c.tier?.name || "Bronze"}
                          </span>
                        </div>
                        <div className="bg-[#181c28] p-1.5 rounded-xl border border-white/[0.04]">
                          <span className="text-zinc-400 block font-medium">Gap to #1</span>
                          <span className="font-mono font-bold text-zinc-200">
                            {c.formattedGapToLeader}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RIVAL GAP SHOWDOWN */}
          {activeTab === "rival" && (
            <div className="space-y-3">
              {rivalData ? (
                <div className="p-4 bg-[#12151e] border border-white/[0.08] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-blue-400" /> Head-to-Head Showdown
                    </span>
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                      Rivalry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="p-3 bg-[#181c28] rounded-xl border border-white/[0.06]">
                      <span className="text-xs text-zinc-400 font-medium block mb-1">
                        {rivalData.userAccount?.displayName}
                      </span>
                      <span className="text-base font-bold text-blue-400 font-mono tabular-nums">
                        {rivalData.userAccount?.formattedDuration}
                      </span>
                    </div>

                    <div className="p-3 bg-[#181c28] rounded-xl border border-white/[0.06]">
                      <span className="text-xs text-zinc-400 font-medium block mb-1">
                        {rivalData.rivalAccount?.displayName}
                      </span>
                      <span className="text-base font-bold text-zinc-300 font-mono tabular-nums">
                        {rivalData.rivalAccount?.formattedDuration}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] text-xs font-medium text-center text-zinc-300">
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
            <div className="space-y-2.5">
              {/* Balance Card */}
              <div className="p-3.5 bg-[#12151e] border border-white/[0.08] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                      Weekly Wager Balance
                    </span>
                    <span className="text-base font-bold text-zinc-100 font-mono tabular-nums">
                      {lockedWager ? 1000 - lockedWager.amount : 1000} <span className="text-xs text-blue-400 font-sans font-bold">PTS</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-[#181c28] px-2 py-0.5 rounded-md border border-white/[0.05]">
                  Week {leaderboardData.weekNumber}
                </span>
              </div>

              {/* Active / Locked Wager Slip */}
              {lockedWager && (
                <div className="p-3.5 bg-[#12151e] border border-blue-500/30 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" /> Wager Locked In
                    </span>
                    <button
                      onClick={() => copyWager(lockedWager)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg tap-effect"
                    >
                      {copiedWager ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                      <span className="text-[10px] font-bold">{copiedWager ? "Copied" : "Share"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-zinc-100 block">
                        Predicted Winner: {lockedWager.targetName}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Staked: <strong className="font-mono text-zinc-200">{lockedWager.amount} pts</strong> @ {lockedWager.odds}x
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold block">Potential Payout</span>
                      <span className="text-xs font-bold text-blue-400 font-mono tabular-nums">
                        +{lockedWager.potentialWin} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wager Amount Selector */}
              <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">Wager Stake:</span>
                  <span className="font-mono font-bold text-blue-400">{wagerAmount} PTS</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setWagerAmount(amt);
                        hapticFeedback("light");
                      }}
                      className={`py-1.5 text-xs font-mono font-bold rounded-xl transition-all tap-effect border ${
                        wagerAmount === amt
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          : "bg-[#181c28] text-zinc-400 border-white/[0.04] hover:text-zinc-200"
                      }`}
                    >
                      {amt === 1000 ? "ALL-IN" : `${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemetry Odds Board */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-1">
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
                        className={`p-3.5 bg-[#12151e] border rounded-2xl transition-all space-y-2.5 ${
                          isSelected
                            ? "border-blue-500/40"
                            : "border-white/[0.08] hover:border-white/[0.14]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                              <span>{oddItem.displayName}</span>
                              <span
                                className={`text-[9px] font-bold uppercase font-mono tracking-wider px-1.5 py-0.5 rounded ${
                                  oddItem.role === "FAVORITE"
                                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                    : oddItem.role === "CONTENDER"
                                    ? "bg-white/[0.06] text-zinc-300 border border-white/[0.08]"
                                    : "bg-[#181c28] text-zinc-400 border border-white/[0.04]"
                                }`}
                              >
                                {oddItem.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              7d: <strong className="font-mono text-zinc-300">{oddItem.formattedDuration}</strong> • {oddItem.impliedProbability}% implied win rate
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-blue-400 font-mono tabular-nums block">
                              {oddItem.odds}x
                            </span>
                            <span className="text-[9px] text-zinc-400 font-medium uppercase font-mono">
                              Payout
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePlaceWager(oddItem)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all tap-effect border border-blue-400/20 flex items-center justify-center gap-1.5"
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>Bet {wagerAmount} pts (Win +{Math.round(wagerAmount * oddItem.odds)} pts)</span>
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
            <div className="space-y-2">
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
                    className="p-3.5 bg-[#12151e] border border-white/[0.08] rounded-2xl flex items-center justify-between hover:border-white/[0.14] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{award.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-zinc-100 block">
                          {award.title}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {award.statDescription}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-200 block">
                        {award.recipientName}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
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
