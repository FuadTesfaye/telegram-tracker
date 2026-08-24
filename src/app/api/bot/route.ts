import { webhookCallback } from "grammy";
import { getTelegramBot } from "@/server/bot/bot";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const bot = getTelegramBot();

const handle = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: 15000,
});

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
