import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  extra?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-sky-400",
  extra,
}: StatCardProps) {
  return (
    <div className="glass-card bg-[#111622]/90 border border-white/[0.08] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-sky-500/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-black text-slate-100 tracking-tight font-mono tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      {extra && <div className="mt-3 pt-2.5 border-t border-white/[0.06]">{extra}</div>}
    </div>
  );
}
