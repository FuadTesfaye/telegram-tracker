import { getTelegramClient } from "./client/client-factory";
import { AccountRepository } from "@/server/repositories/account.repository";
import { SessionStateMachine } from "./engine/session-state-machine";
import { StaleReconciler } from "./engine/stale-reconciler";
import { logger } from "@/lib/logger";

async function startWorker() {
  logger.info("🚀 Starting Telemetr MTProto Tracking Worker...");

  const client = getTelegramClient();
  await client.connect();

  // Load all active tracked accounts
  const activeAccounts = await AccountRepository.listAllActive();
  logger.info(`Loaded ${activeAccounts.length} active tracked accounts to monitor`);

  for (const acc of activeAccounts) {
    try {
      await client.startTracking(
        {
          telegramUserId: acc.telegramUserId,
          username: acc.username || undefined,
          firstName: acc.firstName || undefined,
          lastName: acc.lastName || undefined,
        },
        async (target, presence) => {
          logger.info("Presence update observed", {
            username: target.username,
            userId: target.telegramUserId,
            status: presence.status,
            isOnline: presence.isOnline,
          });

          await SessionStateMachine.handlePresenceChange(acc.id, presence);
        }
      );
    } catch (err) {
      logger.error("Failed to start tracking for account", {
        accountId: acc.id,
        username: acc.username,
        error: err,
      });
    }
  }

  // Periodic stale session reconciler (runs every 10 minutes)
  const reconcilerInterval = setInterval(async () => {
    try {
      const closed = await StaleReconciler.reconcileStaleSessions();
      if (closed > 0) {
        logger.info(`Stale session reconciler closed ${closed} dangling sessions`);
      }
    } catch (err) {
      logger.error("Error running stale session reconciler", { error: err });
    }
  }, 10 * 60 * 1000);

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down tracker worker gracefully...`);
    clearInterval(reconcilerInterval);
    await client.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startWorker().catch((err) => {
  logger.error("Fatal error in Telemetr tracker worker", { error: err });
  process.exit(1);
});
