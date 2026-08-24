import { Bot } from "grammy";
import { env } from "@/lib/env";
import { registerBotHandlers } from "./handlers";
import { logger } from "@/lib/logger";

let botInstance: Bot | null = null;

export function getTelegramBot(): Bot {
  if (botInstance) {
    return botInstance;
  }

  botInstance = new Bot(env.TELEGRAM_BOT_TOKEN, {
    botInfo: {
      id: 8594522566,
      is_bot: true,
      first_name: "The Lurkening",
      username: "lurkening_bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      supports_guest_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false,
    },
  });

  // Error boundary
  botInstance.catch((err) => {
    logger.error("Telegram bot error caught in boundary", {
      ctx: err.ctx?.update?.update_id,
      error: err.error,
    });
  });

  registerBotHandlers(botInstance);

  return botInstance;
}
