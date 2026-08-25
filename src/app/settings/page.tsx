"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/components/telegram-provider";
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Trash2,
  Activity,
  HeartPulse,
} from "lucide-react";

export default function SettingsPage() {
  const { user, hapticFeedback } = useTelegram();
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [longSessionAlert, setLongSessionAlert] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");

  const handleSave = () => {
    hapticFeedback("success");
    setSavedMsg("Settings updated successfully");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
          Settings & Privacy
        </h1>
        <p className="text-xs text-zinc-400 font-medium">
          Preferences, alerts, privacy & system status
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-medium">
          {savedMsg}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Profile & Plan
        </h4>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Telegram ID</span>
          <span className="font-mono text-zinc-200">{user?.telegramId || "—"}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Current Plan</span>
          <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono font-bold uppercase text-[10px] border border-blue-500/20">
            {user?.plan || "free"}
          </span>
        </div>
      </div>

      {/* Timezone */}
      <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Timezone
          </h4>
        </div>

        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#181c28] border border-white/[0.08] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="UTC">UTC (Coordinated Universal Time)</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="Europe/London">Europe/London (GMT/BST)</option>
          <option value="Europe/Paris">Europe/Paris (CET)</option>
          <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
        </select>
      </div>

      {/* Alerts */}
      <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Alerts & Summaries
          </h4>
        </div>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <span className="text-zinc-300 font-medium">Daily Evening Summary (21:00)</span>
          <input
            type="checkbox"
            checked={dailySummary}
            onChange={(e) => setDailySummary(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <span className="text-zinc-300 font-medium">Weekly Progress Report (Mondays)</span>
          <input
            type="checkbox"
            checked={weeklyReport}
            onChange={(e) => setWeeklyReport(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <span className="text-zinc-300 font-medium">Long Session Alert (&gt; 60m)</span>
          <input
            type="checkbox"
            checked={longSessionAlert}
            onChange={(e) => setLongSessionAlert(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
        </label>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all tap-effect border border-blue-400/20 shadow-sm"
        >
          Save Preferences
        </button>
      </div>

      {/* Privacy Guarantee */}
      <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Privacy & Ethics
          </h4>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
          Telemetr records only observable public presence signals starting from
          the moment of tracking activation. We strictly do not access or store
          private conversations, contact lists, or device screen time.
        </p>
      </div>

      {/* Admin Link */}
      <div className="text-center pt-2">
        <Link
          href="/admin"
          className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <HeartPulse className="w-3.5 h-3.5 text-blue-400" /> View System Health
        </Link>
      </div>
    </div>
  );
}
