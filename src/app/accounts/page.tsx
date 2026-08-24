"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import { Users, Plus, Pause, Play, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

import { useCachedData } from "@/lib/use-cached-data";

export default function AccountsPage() {
  const { user, hapticFeedback } = useTelegram();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [labelInput, setLabelInput] = useState("Other");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    data: accountsData,
    isLoading,
    revalidate: fetchAccounts,
    mutate,
  } = useCachedData<{ accounts: any[] }>(
    user ? `/api/accounts?userId=${user.id}` : null,
    { ttlMs: 20000 }
  );

  const accounts = accountsData?.accounts || [];

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !usernameInput.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      hapticFeedback("light");

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: usernameInput.trim(),
          label: labelInput,
          notes: notesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to add account");
      }

      mutate((curr) => ({
        accounts: [...(curr?.accounts || []), data.account],
      }), true);

      setUsernameInput("");
      setNotesInput("");
      setIsAddOpen(false);
      hapticFeedback("medium");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add account");
      hapticFeedback("error");
    } finally {
      setIsSubmitting(false);
    }
  };


  const toggleAccountStatus = async (id: string, currentStatus: string) => {
    try {
      hapticFeedback("light");
      const action = currentStatus === "active" ? "stop" : "resume";
      await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchAccounts();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const maxSlots = 3;
  const usedSlots = accounts.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            League Competitor Slots
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {usedSlots} of {maxSlots} active slots occupied
          </p>
        </div>

        {usedSlots < maxSlots && (
          <button
            onClick={() => {
              setIsAddOpen(true);
              hapticFeedback("light");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors tap-effect border border-sky-400/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Slot
          </button>
        )}
      </div>

      {/* 3-Slot Progress Bar */}
      <div className="p-3 bg-[#11151f] border border-white/[0.08] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200">Enrolled Trio:</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((slotIdx) => {
              const isFilled = slotIdx <= usedSlots;
              return (
                <div
                  key={slotIdx}
                  className={`w-4 h-1.5 rounded-full transition-colors ${
                    isFilled ? "bg-sky-400" : "bg-white/[0.08]"
                  }`}
                />
              );
            })}
          </div>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 font-medium">
          {usedSlots === maxSlots ? "All Slots Full" : `${maxSlots - usedSlots} slot available`}
        </span>
      </div>

      {/* Add Account Modal / Form */}
      {isAddOpen && (
        <div className="bg-[#11151f] border border-sky-500/30 rounded-xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              Add Competitor Slot
            </h3>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 tap-effect"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddAccount} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Telegram @username or Phone
              </label>
              <input
                type="text"
                placeholder="@alice, @bob, etc."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Custom Category
                </label>
                <select
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Self">Myself</option>
                  <option value="Friend">Friend</option>
                  <option value="Work">Co-worker</option>
                  <option value="Girls Group">Girls Group</option>
                  <option value="Boys Group">Boys Group</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Private Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead rival"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/[0.09] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-sm transition-all tap-effect"
            >
              {isSubmitting ? "Resolving via MTProto..." : "Start Observing Slot"}
            </button>
          </form>
        </div>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Accounts Tracked"
          description="Track public Telegram accounts to observe presence sessions and participate in weekly leagues."
          actionText="+ Enroll First Competitor"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="space-y-2.5">
          {accounts.map((acc, idx) => {
            const isActive = acc.trackingStatus === "active";
            const isOnline = acc.lastSeenStatus === "online";

            return (
              <div
                key={acc.id}
                className="p-4 bg-[#111622] border border-white/[0.07] rounded-2xl flex items-center justify-between hover:border-white/[0.14] transition-all"
              >
                <Link
                  href={`/accounts/${acc.id}`}
                  onClick={() => hapticFeedback("light")}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                      #{idx + 1}
                    </div>
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#11151f] ${
                        isOnline ? "bg-emerald-400" : "bg-zinc-600"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{acc.displayName || "@" + acc.username}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/[0.05] text-slate-300 border border-white/[0.06] rounded-md font-semibold">
                        {acc.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Observed since {new Date(acc.trackingStartedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAccountStatus(acc.id, acc.trackingStatus)}
                    title={isActive ? "Pause Tracking" : "Resume Tracking"}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.05] transition-colors tap-effect"
                  >
                    {isActive ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    )}
                  </button>
                  <Link
                    href={`/accounts/${acc.id}`}
                    onClick={() => hapticFeedback("light")}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.05] transition-colors tap-effect"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
