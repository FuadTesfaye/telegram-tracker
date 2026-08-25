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
      { command: "start", description: "Open Choice Hub & Launch Mini App" },
      { command: "league", description: "Weekly League ranks & crown battle" },
      { command: "my", description: "My observed telemetry & chat report" },
      { command: "roast", description: "Satirical roast generator (4 levels)" },
      { command: "rival", description: "Head-to-head rivalry showdown" },
      { command: "bets", description: "Live telemetry multipliers & odds" },
      { command: "compare", description: "Side-by-side account comparison" },
      { command: "footprint", description: "Observed community participation" },
      { command: "awards", description: "Superlatives shelf & weekly trophies" },
      { command: "track", description: "Enroll a new competitor slot" },
      { command: "accounts", description: "Manage 3 competitor slots" },
      { command: "dashboard", description: "Master overview of all slots" },
      { command: "help", description: "Rules, scoring & guidance" },
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

