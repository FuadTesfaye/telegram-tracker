"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/empty-state";
import { Users, Plus, Pause, Play, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AccountsPage() {
  const { user, hapticFeedback } = useTelegram();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [labelInput, setLabelInput] = useState("Other");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/accounts?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

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
      if (!res.ok) {
        throw new Error(data.error || "Failed to add account");
      }

      hapticFeedback("success");
      setUsernameInput("");
      setNotesInput("");
      setIsAddOpen(false);
      await fetchAccounts();
    } catch (err: any) {
      hapticFeedback("error");
      setErrorMsg(err.message || "Failed to add account");
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Tracked Accounts
          </h1>
          <p className="text-xs text-slate-400">
            {accounts.length} account{accounts.length === 1 ? "" : "s"} under observation
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddOpen(true);
            hapticFeedback("light");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Add Account Modal / Form */}
      {isAddOpen && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Track New Account</h3>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddAccount} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Telegram Username
              </label>
              <input
                type="text"
                placeholder="@username or username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Category Label
                </label>
                <select
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Self">Self</option>
                  <option value="Work">Work</option>
                  <option value="Friend">Friend</option>
                  <option value="Family">Family</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Private Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project lead"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? "Resolving Account..." : "Start Tracking"}
            </button>
          </form>
        </div>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Accounts Tracked"
          description="Track public Telegram accounts to observe activity sessions and accumulate historical analytics."
          actionText="+ Track First Account"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="space-y-2.5">
          {accounts.map((acc) => {
            const isActive = acc.trackingStatus === "active";
            const isOnline = acc.lastSeenStatus === "online";

            return (
              <div
                key={acc.id}
                className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <Link
                  href={`/accounts/${acc.id}`}
                  onClick={() => hapticFeedback("light")}
                  className="flex items-center gap-3 flex-1"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{acc.displayName || "@" + acc.username}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md">
                        {acc.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Tracked since {new Date(acc.trackingStartedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAccountStatus(acc.id, acc.trackingStatus)}
                    title={isActive ? "Pause Tracking" : "Resume Tracking"}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {isActive ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  <Link
                    href={`/accounts/${acc.id}`}
                    onClick={() => hapticFeedback("light")}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
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
