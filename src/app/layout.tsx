import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TelegramProvider } from "@/components/telegram-provider";
import { BottomNav } from "@/components/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Telegram WebApp Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased font-sans bg-[#0c0d12] text-zinc-100 min-h-screen selection:bg-blue-500/30 selection:text-white">
        <TelegramProvider>
          <ErrorBoundary>
            <div className="max-w-md mx-auto min-h-screen pb-24 px-4 pt-4">
              {children}
              <BottomNav />
            </div>
          </ErrorBoundary>
        </TelegramProvider>
      </body>
    </html>
  );
}
