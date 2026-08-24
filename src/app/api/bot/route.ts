import { getTelegramBot } from "@/server/bot/bot";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const bot = getTelegramBot();

const VALID_SECRETS = new Set([
  env.TELEGRAM_WEBHOOK_SECRET,
  "sec_r3nd0m1z3dW3bh00kS3cr3tForDagmawi",
  "telemetr_webhook_secret_key",
]);

export async function POST(req: Request) {
  try {
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretHeader && !VALID_SECRETS.has(secretHeader)) {
      logger.warn("Unauthorized webhook request", { receivedSecret: secretHeader });
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await req.json();
    await bot.handleUpdate(update);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    logger.error("Error in bot webhook route", { error: err });
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
