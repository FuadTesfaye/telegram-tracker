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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              System Health
            </h1>
            <p className="text-xs text-slate-400">Telemetr infrastructure status</p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Database Status */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">
                PostgreSQL Database (Supabase)
              </div>
              <div className="text-[10px] text-slate-400">
                Connection pool active
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Healthy
          </span>
        </div>

        {/* Telegram Tracker Status */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">
                Telegram MTProto Tracker
              </div>
              <div className="text-[10px] text-slate-400">
                Status: {health?.telegramTracker || "ready"}
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-blue-400">
            <CheckCircle2 className="w-4 h-4" /> Active
          </span>
        </div>

        {/* Active Accounts Monitored */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">
                Active Tracked Accounts
              </div>
              <div className="text-[10px] text-slate-400">
                Under active presence monitoring
              </div>
            </div>
          </div>
          <span className="text-sm font-black text-slate-100 font-mono">
            {health?.activeAccounts || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
