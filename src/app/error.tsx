"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { formatUserFriendlyError } from "@/lib/error-handler";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendly = formatUserFriendlyError(error);

  useEffect(() => {
    // Silently capture error without leaking raw message to user
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/20">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-black text-slate-100 tracking-tight">
          {friendly.title}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {friendly.message}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all tap-effect border border-sky-400/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>

        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl border border-white/[0.08] transition-all tap-effect"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
}
