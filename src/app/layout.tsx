import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/components/telegram-provider";
import { BottomNav } from "@/components/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Telegram League — Track. Compete. Get Roasted.",
  description:
    "Rank your tracked Telegram accounts in weekly competitions, unlock ridiculous titles, fight your Rival, and get roasted by actual presence numbers.",
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
      <body className="antialiased bg-[#090b10] text-slate-100 min-h-screen">
        <TelegramProvider>
          <ErrorBoundary>
            <div className="max-w-md mx-auto min-h-screen pb-20 px-4 pt-4">
              {children}
              <BottomNav />
            </div>
          </ErrorBoundary>
        </TelegramProvider>
      </body>
    </html>
  );
}
