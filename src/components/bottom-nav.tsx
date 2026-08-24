"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  GitCompare,
  Settings,
} from "lucide-react";
import { useTelegram } from "./telegram-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { hapticFeedback } = useTelegram();

  const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/accounts", label: "Accounts", icon: Users },
    { href: "/compare", label: "Compare", icon: GitCompare },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-t border-slate-800/80 max-w-md mx-auto">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => hapticFeedback("light")}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? "text-blue-400 font-medium scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
