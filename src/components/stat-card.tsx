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
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-800/70">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold text-slate-100 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {extra && <div className="mt-3 pt-2 border-t border-slate-800/60">{extra}</div>}
    </div>
  );
}
