import { webhookCallback } from "grammy";
import { getTelegramBot } from "@/server/bot/bot";
import { BOT_COMMANDS } from "@/server/bot/handlers";
import { getSafeWebAppUrl } from "@/server/bot/menus";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const bot = getTelegramBot();

const handle = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: 15000,
});

export async function GET(req: Request) {
  try {
    const webAppUrl = getSafeWebAppUrl();
    const webhookUrl = `${webAppUrl}/api/bot`;

    // 1. Sync custom bot commands with Telegram
    await bot.api.setMyCommands(BOT_COMMANDS).catch((err) => {
      logger.warn("Failed to set bot commands", { error: err });
    });

    // 2. Set the native Telegram Chat Menu Button to launch the Mini App
    await bot.api
      .setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "🚀 Mini App",
          web_app: { url: webAppUrl },
        },
      })
      .catch((err) => {
        logger.warn("Failed to set chat menu button", { error: err });
      });

    // 3. Register or update the webhook if query has ?setWebhook=true or by default
    const url = new URL(req.url);
    if (url.searchParams.get("syncWebhook") === "true") {
      await bot.api.setWebhook(webhookUrl, {
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: false,
      });
    }

    // 4. Fetch live diagnostics from Telegram Bot API
    const [me, webhookInfo, registeredCommands] = await Promise.all([
      bot.api.getMe().catch((e) => ({ error: e.message })),
      bot.api.getWebhookInfo().catch((e) => ({ error: e.message })),
      bot.api.getMyCommands().catch((e) => ({ error: e.message })),
    ]);

    return Response.json({
      status: "ok",
      runtime: typeof (globalThis as any).Bun !== "undefined" ? "bun" : "node",
      bot: me,
      webhook: webhookInfo,
      commands: registeredCommands,
      miniAppUrl: webAppUrl,
      webhookTargetUrl: webhookUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("Error in bot GET setup handler", { error: err });
    return Response.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err: any) {
    logger.error("Error in bot webhook handler", { error: err });
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
