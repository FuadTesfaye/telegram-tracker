"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Trophy,
  Flame,
  Users,
} from "lucide-react";
import { useTelegram } from "./telegram-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { hapticFeedback } = useTelegram();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/league", label: "League", icon: Trophy },
    { href: "/fun", label: "Roast", icon: Flame },
    { href: "/my", label: "Footprint", icon: User },
    { href: "/accounts", label: "Slots", icon: Users },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto pointer-events-auto">
      <div className="bg-[#10131d]/92 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/60 rounded-2xl p-1.5">
        <div className="flex items-center justify-around h-11">
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
                className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all tap-effect ${
                  isActive
                    ? "bg-blue-500/12 text-blue-400 font-bold border border-blue-500/25"
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? "stroke-[2.25] text-blue-400 scale-105" : "stroke-[1.75]"
                  }`}
                />
                <span className="text-[10px] tracking-tight mt-0.5 font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
