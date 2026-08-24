"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface AppUser {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  timezone: string;
}

interface TelegramContextValue {
  user: AppUser | null;
  isLoading: boolean;
  isTelegramWebApp: boolean;
  refreshUser: () => Promise<void>;
  hapticFeedback: (type?: "light" | "medium" | "heavy" | "success" | "warning" | "error") => void;
}

const TelegramContext = createContext<TelegramContextValue>({
  user: null,
  isLoading: true,
  isTelegramWebApp: false,
  refreshUser: async () => {},
  hapticFeedback: () => {},
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  const initAuth = async () => {
    try {
      setIsLoading(true);
      let initData = "";

      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        initData = tg.initData || "";
        setIsTelegramWebApp(!!initData);
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to authenticate Telegram user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const hapticFeedback = (type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") => {
    try {
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
        const haptic = (window as any).Telegram.WebApp.HapticFeedback;
        if (type === "success" || type === "warning" || type === "error") {
          haptic.notificationOccurred(type);
        } else {
          haptic.impactOccurred(type);
        }
      }
    } catch (e) {
      // Ignored outside Telegram app
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        isLoading,
        isTelegramWebApp,
        refreshUser: initAuth,
        hapticFeedback,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
