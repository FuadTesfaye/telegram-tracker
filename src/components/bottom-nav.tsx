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
    <nav className="fixed bottom-2.5 left-2.5 right-2.5 z-50 max-w-md mx-auto">
      <div className="bg-[#0e1118] border border-white/[0.09] rounded-xl p-1">
        <div className="flex items-center justify-around h-12">
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
                className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all tap-effect ${
                  isActive
                    ? "text-sky-400 font-semibold bg-white/[0.05]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? "stroke-[2.25] text-sky-400" : "stroke-[1.5]"
                  }`}
                />
                <span className="text-[10px] tracking-tight mt-0.5 font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-sky-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
