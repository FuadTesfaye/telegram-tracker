"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { formatUserFriendlyError } from "@/lib/error-handler";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendly = formatUserFriendlyError(error);

  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090b10] text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel bg-[#10141e]/90 border border-white/[0.08] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-slate-100 tracking-tight">
              {friendly.title}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {friendly.message}
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-xl shadow-md transition-all tap-effect flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
