"use client";

import React, { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { formatDuration } from "@/lib/utils";
import type { UserFootprintOverview, ChatFootprintItem } from "@/server/services/footprint.service";
import {
  Smartphone,
  MessageSquare,
  Users,
  UserCheck,
  Clock,
  Tag,
  ShieldCheck,
  Lock,
} from "lucide-react";

import { useCachedData } from "@/lib/use-cached-data";

export default function MyTelegramPage() {
  const { user, hapticFeedback } = useTelegram();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [customLabelInput, setCustomLabelInput] = useState("");

  const {
    data: footprintData,
    isLoading,
    revalidate: loadFootprint,
  } = useCachedData<{ footprint: UserFootprintOverview }>(
    user ? `/api/footprint?userId=${user.id}` : null,
    { ttlMs: 30000 }
  );

  const footprint = footprintData?.footprint || null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !phoneInput.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      hapticFeedback("light");

      const res = await fetch("/api/auth/telegram-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_code",
          userId: user.id,
          phoneNumber: phoneInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setPhoneCodeHash(data.phoneCodeHash);
      hapticFeedback("success");
    } catch (err: any) {
      hapticFeedback("error");
      setErrorMsg(err.message || "Failed to send verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !codeInput.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      hapticFeedback("light");

      const res = await fetch("/api/auth/telegram-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          userId: user.id,
          code: codeInput.trim(),
          password: passwordInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify code");

      hapticFeedback("success");
      setIsConnectOpen(false);
      await loadFootprint();
    } catch (err: any) {
      hapticFeedback("error");
      setErrorMsg(err.message || "Failed to authenticate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLabel = async (chatId: string) => {
    if (!customLabelInput.trim()) return;
    try {
      hapticFeedback("light");
      await fetch("/api/footprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          customLabel: customLabelInput.trim(),
        }),
      });
      setEditingChatId(null);
      setCustomLabelInput("");
      await loadFootprint();
    } catch (err) {
      console.error("Failed to save label:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            👤 My Telegram Footprint
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Observed activity breakdown & community footprint
          </p>
        </div>

        <button
          onClick={() => {
            setIsConnectOpen(true);
            hapticFeedback("light");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all tap-effect border border-sky-400/20"
        >
          <Smartphone className="w-3.5 h-3.5" /> Connect MTProto
        </button>
      </div>

      {/* Connect Account Modal */}
      {isConnectOpen && (
        <div className="glass-panel bg-[#10141e]/95 border border-sky-500/30 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-400" /> Connect MTProto Session
            </h3>
            <button
              onClick={() => {
                setIsConnectOpen(false);
                setPhoneCodeHash(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 tap-effect"
            >
              Cancel
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Authorize your Telegram session to unlock personal message frequencies,
            community breakdowns, and private conversation footprints.
          </p>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {!phoneCodeHash ? (
            <form onSubmit={handleSendCode} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Phone Number (International Format)
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-sm transition-all tap-effect"
              >
                {isSubmitting ? "Sending Code via Telegram..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Telegram Login Code
                </label>
                <input
                  type="text"
                  placeholder="12345"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  2FA Password (if enabled)
                </label>
                <input
                  type="password"
                  placeholder="Optional 2FA password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-sm transition-all tap-effect"
              >
                {isSubmitting ? "Authenticating..." : "Authorize & Connect"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Master Footprint Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Observed Time"
          value={footprint?.formattedTotalDuration || "0m"}
          subtitle="Observed chats presence"
          icon={Clock}
          iconColor="text-sky-400"
        />
        <StatCard
          title="Messages Sent"
          value={footprint?.totalMessagesSent || 0}
          subtitle="Observable count"
          icon={MessageSquare}
          iconColor="text-sky-400"
        />
        <StatCard
          title="Active Groups"
          value={footprint?.activeGroupsCount || 0}
          subtitle="Community participation"
          icon={Users}
          iconColor="text-sky-400"
        />
        <StatCard
          title="Private Chats"
          value={footprint?.activePrivateChatsCount || 0}
          subtitle="Direct conversations"
          icon={UserCheck}
          iconColor="text-sky-400"
        />
      </div>

      {/* Chat Category Breakdown */}
      <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Observed Activity Share
        </h4>

        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                👥 Group Chats
              </span>
              <span className="font-mono font-bold text-sky-400">
                {footprint?.chatBreakdown.groupsPercent || 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${footprint?.chatBreakdown.groupsPercent || 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                👤 Private Chats
              </span>
              <span className="font-mono font-bold text-sky-300">
                {footprint?.chatBreakdown.privateChatsPercent || 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full bg-sky-400 rounded-full transition-all"
                style={{ width: `${footprint?.chatBreakdown.privateChatsPercent || 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                📢 Channels
              </span>
              <span className="font-mono font-bold text-sky-400">
                {footprint?.chatBreakdown.channelsPercent || 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full bg-sky-600 rounded-full transition-all"
                style={{ width: `${footprint?.chatBreakdown.channelsPercent || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Observed Chats List */}
      <div className="glass-card bg-[#111622]/80 border border-white/[0.07] rounded-2xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Observed Communities & Chats ({footprint?.chats.length || 0})
        </h4>

        {!footprint?.chats || footprint.chats.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">
            No observed chats yet. Connect your Telegram or add groups to begin tracking chat footprints.
          </div>
        ) : (
          <div className="space-y-2.5">
            {footprint.chats.map((c) => (
              <div
                key={c.chatId}
                className="p-3.5 bg-black/30 border border-white/[0.06] rounded-xl space-y-2 hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{c.title}</span>
                      {c.customLabel && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-md font-semibold">
                          {c.customLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {c.messageCount} messages • <span className="font-mono">{c.formattedDuration}</span> active ({c.percentageOfActivity}% share)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingChatId(c.chatId);
                      setCustomLabelInput(c.customLabel || "");
                    }}
                    className="p-2 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white border border-white/[0.06] tap-effect"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {editingChatId === c.chatId && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <input
                      type="text"
                      placeholder="e.g. Work, Favorite Human"
                      value={customLabelInput}
                      onChange={(e) => setCustomLabelInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-black/40 border border-white/[0.1] rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      onClick={() => handleSaveLabel(c.chatId)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg tap-effect"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChatId(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 tap-effect"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Guarantee */}
      <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Telegram Footprint only aggregates chats and communities where your authorized session has legitimate visibility. Message contents are never stored.
        </span>
      </div>
    </div>
  );
}
