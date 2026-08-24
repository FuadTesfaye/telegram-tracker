import { Bot } from "grammy";
import { env } from "@/lib/env";
import { registerBotHandlers } from "./handlers";

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

  // Safe user-friendly error boundary for bot
  botInstance.catch(async (err) => {
    try {
      if (err.ctx && typeof err.ctx.reply === "function") {
        await err.ctx.reply(
          "⚠️ <i>An unexpected hiccup occurred. We're handling it!</i>\n\nPlease tap /start or try again in a moment.",
          { parse_mode: "HTML" }
        );
      }
    } catch {
      // Ignore if user blocked or chat unreachable
    }
  });

  registerBotHandlers(botInstance);

  return botInstance;
}
