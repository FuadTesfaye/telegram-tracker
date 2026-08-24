"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import type { RoastLevel } from "@/server/services/roast-engine.service";
import {
  Flame,
  Medal,
  Sparkles,
  Share2,
  Crown,
  CheckCircle2,
  Lock,
  RefreshCw,
  Skull,
  Smile,
  Zap,
} from "lucide-react";

export default function FunPage() {
  const { user, hapticFeedback } = useTelegram();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>("normal");
  const [roastData, setRoastData] = useState<any>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
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
      }
    };

    fetchAccounts();
  }, [user]);

  const loadRoast = async () => {
    if (!user || !selectedAccountId) return;
    try {
      setIsRoasting(true);
      hapticFeedback("heavy");
      const res = await fetch(
        `/api/league/roast?userId=${user.id}&accountId=${selectedAccountId}&level=${roastLevel}`
      );
      if (res.ok) {
        const data = await res.json();
        setRoastData(data);
      }
    } catch (err) {
      console.error("Failed to load roast:", err);
    } finally {
      setIsRoasting(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      loadRoast();
    }
  }, [selectedAccountId, roastLevel]);

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
      title: "Blue Check Warrior",
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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-1.5">
          🔥 Roast Me & Achievements
        </h1>
        <p className="text-xs text-slate-400">
          Statistics-driven roasts and competitive milestones
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No Accounts to Roast"
          description="Enroll an account to generate custom statistics-backed roasts."
        />
      ) : (
        <>
          {/* Account Selector */}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-rose-600/20 text-rose-400 border-rose-500/60"
                      : "bg-slate-900/60 text-slate-400 border-slate-800"
                  }`}
                >
                  {acc.displayName || "@" + acc.username}
                </button>
              );
            })}
          </div>

          {/* Roast Level Selector */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
            <button
              onClick={() => {
                setRoastLevel("friendly");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                roastLevel === "friendly"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smile className="w-3.5 h-3.5" /> Friendly
            </button>
            <button
              onClick={() => {
                setRoastLevel("normal");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                roastLevel === "normal"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Normal
            </button>
            <button
              onClick={() => {
                setRoastLevel("brutal");
                hapticFeedback("light");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                roastLevel === "brutal"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Skull className="w-3.5 h-3.5" /> Brutal
            </button>
            <button
              onClick={() => {
                setRoastLevel("nuclear");
                hapticFeedback("heavy");
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                roastLevel === "nuclear"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Nuclear
            </button>
          </div>

          {/* Roast Card */}
          {roastData && (
            <div className="bg-gradient-to-b from-rose-950/40 to-slate-900/90 border border-rose-800/60 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-800/60 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {roastData.headline}
                </span>

                <button
                  onClick={loadRoast}
                  disabled={isRoasting}
                  className="p-1.5 text-slate-400 hover:text-slate-200"
                >
                  <RefreshCw className={`w-4 h-4 ${isRoasting ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div>
                <div className="text-sm font-black text-slate-100 mb-1">
                  {roastData.target.displayName}
                </div>
                <div className="text-xs text-amber-300 font-semibold">
                  {roastData.target.title} • {roastData.target.formattedDuration} observed
                </div>
              </div>

              <blockquote className="text-sm italic font-serif text-slate-200 leading-relaxed border-l-2 border-rose-500 pl-3">
                "{roastData.roastText || roastData.roast}"
              </blockquote>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs font-semibold text-rose-300">
                {roastData.verdict}
              </div>

              <button
                onClick={copyRoast}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copied ? "Copied to Clipboard! 🔥" : "Share This Roast"}
              </button>
            </div>
          )}

          {/* League Promotion Tiers */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              🏆 League Promotion Tiers
            </h4>

            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { name: "Bronze", icon: "🥉", hours: "< 10h" },
                { name: "Silver", icon: "🥈", hours: "10-20h" },
                { name: "Gold", icon: "🥇", hours: "20-30h" },
                { name: "Diamond", icon: "💎", hours: "30-40h" },
                { name: "Royalty", icon: "👑", hours: "40h+" },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center"
                >
                  <span className="text-lg">{tier.icon}</span>
                  <span className="text-[10px] font-bold text-slate-200 mt-0.5">
                    {tier.name}
                  </span>
                  <span className="text-[8px] text-slate-400">{tier.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              🏅 Competitive Achievements
            </h4>

            <div className="space-y-2">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    ach.unlocked
                      ? "bg-slate-950/60 border-slate-800"
                      : "bg-slate-950/30 border-slate-900 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-1.5 rounded-lg bg-slate-900">
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
                      <div className="text-[10px] text-slate-400">
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
