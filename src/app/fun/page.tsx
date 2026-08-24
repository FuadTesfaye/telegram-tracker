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
    <div className="space-y-3.5">
      <div>
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
          🔥 Roast Hub & Milestones
        </h1>
        <p className="text-xs text-zinc-400 font-medium">
          Telemetry-backed satirical verdicts and competitive achievements
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    hapticFeedback("light");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border tap-effect ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      : "bg-[#11151f] text-zinc-400 border-white/[0.06] hover:text-zinc-200"
                  }`}
                >
                  {acc.displayName || "@" + acc.username}
                </button>
              );
            })}
          </div>

          {/* 4-Tier Roast Level Segmented Switcher */}
          <div className="bg-[#10131b] border border-white/[0.08] p-1 rounded-xl flex items-center justify-between text-xs font-semibold">
            <button
              onClick={() => {
                setRoastLevel("friendly");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "friendly"
                  ? "bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Smile className="w-3.5 h-3.5" /> Friendly
            </button>
            <button
              onClick={() => {
                setRoastLevel("normal");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "normal"
                  ? "bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Spicy
            </button>
            <button
              onClick={() => {
                setRoastLevel("brutal");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "brutal"
                  ? "bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Skull className="w-3.5 h-3.5" /> Brutal
            </button>
            <button
              onClick={() => {
                setRoastLevel("nuclear");
                hapticFeedback("heavy");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 tap-effect ${
                roastLevel === "nuclear"
                  ? "bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Nuclear
            </button>
          </div>

          {/* Clean Telemetry Roast Card */}
          {roastData && (
            <div className="bg-[#11151f] border border-white/[0.08] rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 fill-sky-400" /> {roastData.headline}
                </span>

                <button
                  onClick={loadRoast}
                  disabled={isRoasting}
                  className="p-1 text-zinc-400 hover:text-white transition-colors tap-effect"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRoasting ? "animate-spin text-sky-400" : ""}`} />
                </button>
              </div>

              <div>
                <div className="text-sm font-bold text-zinc-100 tracking-tight">
                  {roastData.target.displayName}
                </div>
                <div className="text-xs text-sky-400 font-medium mt-0.5 flex items-center gap-2">
                  <span>{roastData.target.title}</span>
                  <span>•</span>
                  <span className="font-mono tabular-nums text-zinc-400">{roastData.target.formattedDuration} observed</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/40 border border-white/[0.06] rounded-xl relative">
                <Quote className="w-4 h-4 text-zinc-600 mb-1 opacity-50" />
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {roastData.roastText || roastData.roast}
                </p>
              </div>

              <div className="p-2.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-xs font-medium text-zinc-300 text-center">
                {roastData.verdict}
              </div>

              <button
                onClick={copyRoast}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 border border-sky-400/20 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 tap-effect"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
                <span>{copied ? "Copied to Clipboard!" : "Share This Roast"}</span>
              </button>
            </div>
          )}

          {/* Promotion Tiers */}
          <div className="bg-[#11151f] border border-white/[0.08] rounded-xl p-3.5 space-y-2.5">
            <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              League Promotion Tiers
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
                  className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex flex-col items-center"
                >
                  <span className="text-sm">{tier.icon}</span>
                  <span className="text-[10px] font-semibold text-zinc-200 mt-1">
                    {tier.name}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">
                    {tier.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="bg-[#11151f] border border-white/[0.08] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Earned Badges
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">
                {achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-colors flex items-start gap-2.5 ${
                    item.unlocked
                      ? "bg-black/30 border-white/[0.08]"
                      : "bg-black/10 border-white/[0.03] opacity-40"
                  }`}
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-zinc-100 truncate">
                        {item.title}
                      </span>
                      {item.unlocked ? (
                        <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
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
