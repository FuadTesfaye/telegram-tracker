import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#12151e] border border-white/[0.08] rounded-2xl">
      <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl mb-3.5 text-blue-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-xs mt-1 mb-4 leading-relaxed font-medium">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all tap-effect border border-blue-400/20 shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
