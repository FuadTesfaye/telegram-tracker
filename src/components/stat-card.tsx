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
  iconColor = "text-blue-400",
  extra,
}: StatCardProps) {
  return (
    <div className="bg-[#12151e] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col justify-between hover:border-white/[0.14] transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
      </div>

      <div>
        <div className="text-xl font-bold text-zinc-100 tracking-tight font-mono tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-zinc-400 mt-0.5 font-medium leading-tight">{subtitle}</p>
        )}
      </div>

      {extra && <div className="mt-2.5 pt-2 border-t border-white/[0.05]">{extra}</div>}
    </div>
  );
}
