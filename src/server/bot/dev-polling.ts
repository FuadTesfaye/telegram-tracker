import { getTelegramBot } from "./bot";
import { logger } from "@/lib/logger";

async function main() {
  logger.info("🤖 Starting Telemetr Telegram Bot in Long-Polling mode...");
  const bot = getTelegramBot();

  await bot.init();
  logger.info(`✅ Logged in as @${bot.botInfo.username} (${bot.botInfo.id})`);

  // Set bot description and menu button
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Open Telemetr Master Dashboard" },
      { command: "track", description: "Track a new Telegram account" },
      { command: "accounts", description: "List tracked accounts" },
      { command: "dashboard", description: "Overview of all accounts" },
      { command: "help", description: "Help and usage instructions" },
    ]);
    logger.info("Bot commands registered with Telegram API");
  } catch (err) {
    logger.warn("Could not set bot commands", { error: err });
  }

  await bot.start({
    onStart: () => {
      logger.info("🚀 Telegram Bot is now listening for incoming messages & callbacks!");
    },
  });
}

main().catch((err) => {
  logger.error("Error starting dev polling bot", { error: err });
  process.exit(1);
});
