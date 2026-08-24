import { Bot } from "grammy";
import { env } from "@/lib/env";
import { registerBotHandlers } from "./handlers";
import { logger } from "@/lib/logger";

let botInstance: Bot | null = null;

export function getTelegramBot(): Bot {
  if (botInstance) {
    return botInstance;
  }

  botInstance = new Bot(env.TELEGRAM_BOT_TOKEN);

  // Error handling middleware
  botInstance.catch((err) => {
    logger.error("Telegram bot error caught in boundary", {
      ctx: err.ctx?.update?.update_id,
      error: err.error,
    });
  });

  // Register command and callback handlers
  registerBotHandlers(botInstance);

  return botInstance;
}
