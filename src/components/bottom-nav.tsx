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
    <nav className="fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto">
      <div className="glass-panel bg-[#0d111a]/90 backdrop-blur-xl border border-white/[0.09] rounded-2xl p-1.5 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-around h-13">
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
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all tap-effect ${
                  isActive
                    ? "text-sky-400 font-semibold bg-white/[0.06]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "stroke-[2.25] scale-105" : "stroke-[1.5]"
                  }`}
                />
                <span className="text-[10px] tracking-tight mt-0.5 font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
