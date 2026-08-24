import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/components/telegram-provider";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Telemetr — Telegram Activity Intelligence",
  description:
    "Track observable Telegram activity, understand presence patterns, and explore verified historical analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Telegram WebApp Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        <TelegramProvider>
          <div className="max-w-md mx-auto min-h-screen pb-20 px-4 pt-4">
            {children}
            <BottomNav />
          </div>
        </TelegramProvider>
      </body>
    </html>
  );
}
