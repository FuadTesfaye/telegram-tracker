import Link from "next/link";
import { Compass, Home, Trophy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/20">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-black text-slate-100 tracking-tight">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          The section or competitor profile you're looking for doesn't seem to exist or has moved.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all tap-effect border border-sky-400/20"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home Dashboard</span>
        </Link>

        <Link
          href="/league"
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl border border-white/[0.08] transition-all tap-effect"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Weekly League</span>
        </Link>
      </div>
    </div>
  );
}
