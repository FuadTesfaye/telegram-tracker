import { webhookCallback } from "grammy";
import { getTelegramBot } from "@/server/bot/bot";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const bot = getTelegramBot();

export async function POST(req: Request) {
  try {
    const handle = webhookCallback(bot, "std/http", {
      secretToken: env.TELEGRAM_WEBHOOK_SECRET,
    });
    return await handle(req);
  } catch (err) {
    console.error("Error in bot webhook handler", err);
    return new Response("Webhook Error", { status: 500 });
  }
}
