"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import type { RoastLevel } from "@/server/services/roast-engine.service";
import {
  Flame,
  Medal,
  Share2,
  Check,
  CheckCircle2,
  Lock,
  RefreshCw,
  Skull,
  Smile,
  Zap,
  Quote,
} from "lucide-react";

import { useCachedData } from "@/lib/use-cached-data";

export default function FunPage() {
  const { user, hapticFeedback } = useTelegram();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>("normal");
  const [copied, setCopied] = useState(false);

  // Cached accounts list
  const { data: accountsData } = useCachedData<{ accounts: any[] }>(
    user ? `/api/accounts?userId=${user.id}` : null,
    { ttlMs: 20000 }
  );

  const accounts = accountsData?.accounts || [];

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Cached roast data per account & level
  const roastUrl =
    user && selectedAccountId
      ? `/api/league/roast?userId=${user.id}&accountId=${selectedAccountId}&level=${roastLevel}`
      : null;

  const {
    data: roastData,
    isLoading: isRoasting,
    revalidate: loadRoast,
  } = useCachedData<any>(roastUrl, { ttlMs: 30000 });

  const copyRoast = () => {
    if (!roastData) return;
    hapticFeedback("success");
    const shareText = `🔥 Telegram League Roast (${roastLevel.toUpperCase()})\n\nTarget: ${roastData.target.displayName}\nTitle: ${roastData.target.title}\n\n"${roastData.roastText || roastData.roast}"\n\n${roastData.verdict}\n\n🏆 Track. Compete. Get Roasted on Telegram League!`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const achievements = [
    {
      id: "first_blood",
      title: "First Blood",
      description: "Completed your first tracked week in Telegram League",
      icon: "🩸",
      unlocked: true,
    },
    {
      id: "citizen",
      title: "Telegram Citizen",
      description: "100 hours of observable presence recorded",
      icon: "🏙️",
      unlocked: false,
    },
    {
      id: "blue_check",
      title: "Notification Warrior",
      description: "Recorded 50+ presence sessions in a single week",
      icon: "⚔️",
      unlocked: true,
    },
    {
      id: "no_outside",
      title: "No Outside",
      description: "30 consecutive active days with recorded presence",
      icon: "🪟",
      unlocked: false,
    },
    {
      id: "touch_grass",
      title: "Touch Grass",
      description: "Won the Ghost Award for lowest activity of the week",
      icon: "🌿",
      unlocked: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-1.5">
          🔥 Roast Me & Achievements
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Telemetry-backed satirical verdicts and competitive milestones
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No Accounts to Roast"
          description="Enroll an account to generate custom telemetry-backed roasts."
        />
      ) : (
        <>
          {/* Account Selector Pills */}
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border tap-effect ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm"
                      : "bg-[#111622]/80 text-slate-400 border-white/[0.06] hover:text-slate-200"
                  }`}
                >
                  {acc.displayName || "@" + acc.username}
                </button>
              );
            })}
          </div>

          {/* 4-Tier Roast Level Segmented Switcher */}
          <div className="bg-[#10141e] border border-white/[0.08] p-1 rounded-xl flex items-center justify-between text-xs font-bold shadow-inner">
            <button
              onClick={() => {
                setRoastLevel("friendly");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "friendly"
                  ? "bg-sky-500/20 text-sky-300 font-black border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Smile className="w-3.5 h-3.5" /> Friendly
            </button>
            <button
              onClick={() => {
                setRoastLevel("normal");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "normal"
                  ? "bg-sky-500/20 text-sky-300 font-black border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Spicy
            </button>
            <button
              onClick={() => {
                setRoastLevel("brutal");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "brutal"
                  ? "bg-sky-500/20 text-sky-300 font-black border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Skull className="w-3.5 h-3.5" /> Brutal
            </button>
            <button
              onClick={() => {
                setRoastLevel("nuclear");
                hapticFeedback("heavy");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "nuclear"
                  ? "bg-sky-500/20 text-sky-300 font-black border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Nuclear
            </button>
          </div>

          {/* Clean Telemetry Roast Card */}
          {roastData && (
            <div className="glass-panel bg-[#111622]/90 border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 fill-sky-400" /> {roastData.headline}
                </span>

                <button
                  onClick={loadRoast}
                  disabled={isRoasting}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors tap-effect"
                >
                  <RefreshCw className={`w-4 h-4 ${isRoasting ? "animate-spin text-sky-400" : ""}`} />
                </button>
              </div>

              <div>
                <div className="text-base font-black text-slate-100 tracking-tight">
                  {roastData.target.displayName}
                </div>
                <div className="text-xs text-sky-400 font-semibold mt-0.5 flex items-center gap-2">
                  <span>{roastData.target.title}</span>
                  <span>•</span>
                  <span className="font-mono tabular-nums text-slate-300">{roastData.target.formattedDuration} observed</span>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/[0.06] rounded-2xl relative">
                <Quote className="w-5 h-5 text-slate-600 mb-1 opacity-50" />
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {roastData.roastText || roastData.roast}
                </p>
              </div>

              <div className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-xs font-semibold text-slate-300 text-center">
                {roastData.verdict}
              </div>

              <button
                onClick={copyRoast}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 border border-sky-400/20 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tap-effect"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
                <span>{copied ? "Copied to Clipboard! 🔥" : "Share This Roast"}</span>
              </button>
            </div>
          )}

          {/* Promotion Tiers */}
          <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              🏆 League Promotion Tiers
            </h4>

            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { name: "Bronze", icon: "🥉", hours: "< 10h" },
                { name: "Silver", icon: "🥈", hours: "10-20h" },
                { name: "Gold", icon: "🥇", hours: "20-30h" },
                { name: "Diamond", icon: "💎", hours: "30-40h" },
                { name: "Royalty", icon: "👑", hours: "40h+" },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className="p-2.5 rounded-xl bg-black/30 border border-white/[0.05] flex flex-col items-center"
                >
                  <span className="text-base">{tier.icon}</span>
                  <span className="text-[10px] font-bold text-slate-200 mt-1">
                    {tier.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{tier.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              🏅 Competitive Achievements
            </h4>

            <div className="space-y-2">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    ach.unlocked
                      ? "bg-black/30 border-white/[0.06]"
                      : "bg-black/15 border-white/[0.03] opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                      {ach.icon}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{ach.title}</span>
                        {ach.unlocked ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Lock className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {ach.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
