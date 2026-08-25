"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Activity, Database, Radio } from "lucide-react";

export default function AdminPage() {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("Health check error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/settings"
            className="p-2 rounded-xl bg-[#12151e] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 tap-effect"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
              System Health
            </h1>
            <p className="text-xs text-zinc-400 font-medium">Telemetr infrastructure status</p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 rounded-xl bg-[#12151e] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 tap-effect"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* Database Status */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100">
                PostgreSQL Database (Supabase)
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Connection pool active
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
          </span>
        </div>

        {/* Telegram Tracker Status */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100">
                Telegram MTProto Tracker
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Status: {health?.telegramTracker || "ready"}
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        </div>

        {/* Active Accounts Monitored */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100">
                Active Tracked Accounts
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Under active presence monitoring
              </div>
            </div>
          </div>
          <span className="text-sm font-bold text-zinc-100 font-mono tabular-nums">
            {health?.activeAccounts || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
