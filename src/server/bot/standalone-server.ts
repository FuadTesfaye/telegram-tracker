/**
 * Ultra-fast Standalone Telegram Bot Webhook Server running natively on Bun
 * Provides sub-millisecond webhook request handling and automatic sync.
 */
import { webhookCallback } from "grammy";
import { getTelegramBot } from "./bot";
import { BOT_COMMANDS } from "./handlers";
import { getSafeWebAppUrl } from "./menus";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const bot = getTelegramBot();

const handle = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: 15000,
});

// Auto-sync commands and menu button on server startup
async function setupBot() {
  try {
    const webAppUrl = getSafeWebAppUrl();
    await bot.api.setMyCommands(BOT_COMMANDS).catch(() => {});
    await bot.api
      .setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "🚀 Mini App",
          web_app: { url: webAppUrl },
        },
      })
      .catch(() => {});
    logger.info("✅ Telegram Bot commands and menu button synchronized successfully.");
  } catch (e: any) {
    logger.warn("Could not auto-sync commands on startup", { error: e.message });
  }
}

setupBot();

console.log(`⚡ Telegram Bot Webhook Server starting on Bun (Port: ${port})...`);

export default {
  port,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Health & diagnostics route
    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        runtime: "bun",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }

    // Bot setup / sync / status route
    if (req.method === "GET" && (url.pathname === "/api/bot" || url.pathname === "/bot")) {
      const webAppUrl = getSafeWebAppUrl();
      const webhookUrl = `${webAppUrl}/api/bot`;

      const [me, webhookInfo, registeredCommands] = await Promise.all([
        bot.api.getMe().catch((e) => ({ error: e.message })),
        bot.api.getWebhookInfo().catch((e) => ({ error: e.message })),
        bot.api.getMyCommands().catch((e) => ({ error: e.message })),
      ]);

      return Response.json({
        status: "ok",
        runtime: "bun",
        bot: me,
        webhook: webhookInfo,
        commands: registeredCommands,
        miniAppUrl: webAppUrl,
        timestamp: new Date().toISOString(),
      });
    }

    // Telegram webhook handler
    if (req.method === "POST" && (url.pathname === "/api/bot" || url.pathname === "/bot" || url.pathname === "/")) {
      try {
        return await handle(req);
      } catch (err: any) {
        logger.error("Error in Bun webhook handler", { error: err });
        return new Response(JSON.stringify({ ok: false, error: err?.message }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
