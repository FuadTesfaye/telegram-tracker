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
  Radio,
  Clock,
  Zap,
  Tag,
  ShieldCheck,
  Send,
  Lock,
  Flame,
} from "lucide-react";

export default function MyTelegramPage() {
  const { user, hapticFeedback } = useTelegram();
  const [footprint, setFootprint] = useState<UserFootprintOverview | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [customLabelInput, setCustomLabelInput] = useState("");

  const loadFootprint = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/footprint?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFootprint(data.footprint);
      }
    } catch (err) {
      console.error("Failed to load footprint:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFootprint();
  }, [user]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            👤 My Telegram
          </h1>
          <p className="text-xs text-slate-400">
            Personal presence, observed footprint & chat stats
          </p>
        </div>

        <button
          onClick={() => {
            setIsConnectOpen(true);
            hapticFeedback("light");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" /> Connect Account
        </button>
      </div>

      {/* Connect Account Modal */}
      {isConnectOpen && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-400" /> Connect My Telegram
            </h3>
            <button
              onClick={() => {
                setIsConnectOpen(false);
                setPhoneCodeHash(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Authorize your Telegram session to unlock full personal message frequencies,
            active community breakdowns, and private chat footprints.
          </p>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {!phoneCodeHash ? (
            <form onSubmit={handleSendCode} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Phone Number (International Format)
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? "Sending Code via Telegram..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Telegram Login Code
                </label>
                <input
                  type="text"
                  placeholder="12345"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  2FA Password (if enabled)
                </label>
                <input
                  type="password"
                  placeholder="Optional 2FA password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? "Authenticating..." : "Authorize & Connect"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Total Observed"
          value={footprint?.formattedTotalDuration || "0m"}
          subtitle="Observed presence"
          icon={Clock}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Messages Sent"
          value={footprint?.totalMessagesSent || 0}
          subtitle="Observed footprint"
          icon={MessageSquare}
          iconColor="text-emerald-400"
        />
        <StatCard
          title="Active Groups"
          value={footprint?.activeGroupsCount || 0}
          subtitle="Communities active"
          icon={Users}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Private Chats"
          value={footprint?.activePrivateChatsCount || 0}
          subtitle="Direct conversations"
          icon={UserCheck}
          iconColor="text-amber-400"
        />
      </div>

      {/* Chat Category Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Observed Activity Share
        </h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              👥 Group Chats
            </span>
            <span className="font-bold text-blue-400">
              {footprint?.chatBreakdown.groupsPercent || 0}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${footprint?.chatBreakdown.groupsPercent || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              👤 Private Chats
            </span>
            <span className="font-bold text-emerald-400">
              {footprint?.chatBreakdown.privateChatsPercent || 0}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${footprint?.chatBreakdown.privateChatsPercent || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              📢 Channels
            </span>
            <span className="font-bold text-purple-400">
              {footprint?.chatBreakdown.channelsPercent || 0}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${footprint?.chatBreakdown.channelsPercent || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Observed Chats List */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Observed Communities & Chats ({footprint?.chats.length || 0})
          </h4>
        </div>

        {!footprint?.chats || footprint.chats.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No observed chats yet. Connect your Telegram or add groups to begin tracking chat footprints.
          </div>
        ) : (
          <div className="space-y-2.5">
            {footprint.chats.map((c) => (
              <div
                key={c.chatId}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{c.title}</span>
                      {c.customLabel && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-800/60 rounded">
                          {c.customLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {c.messageCount} messages • {c.formattedDuration} active ({c.percentageOfActivity}% share)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingChatId(c.chatId);
                      setCustomLabelInput(c.customLabel || "");
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {editingChatId === c.chatId && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="e.g. Work, Favorite Human"
                      value={customLabelInput}
                      onChange={(e) => setCustomLabelInput(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveLabel(c.chatId)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChatId(null)}
                      className="text-xs text-slate-400 hover:text-slate-200"
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
      <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Telegram Footprint only aggregates chats and communities where your authorized session has legitimate visibility. Message contents are not stored.
        </span>
      </div>
    </div>
  );
}
