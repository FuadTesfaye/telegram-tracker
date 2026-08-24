import type { TelegramTrackingClient } from "./telegram-client.interface";
import { MockTelegramClient } from "./mock-client";
import { GramJsTelegramClient } from "./gramjs-client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let singletonClient: TelegramTrackingClient | null = null;

export function getTelegramClient(): TelegramTrackingClient {
  if (singletonClient) {
    return singletonClient;
  }

  const apiId = env.TELEGRAM_API_ID ? parseInt(env.TELEGRAM_API_ID, 10) : 0;
  const apiHash = env.TELEGRAM_API_HASH;

  if (apiId > 0 && apiHash) {
    logger.info("Initializing Live GramJS MTProto client with API credentials");
    singletonClient = new GramJsTelegramClient(apiId, apiHash);
  } else {
    logger.info(
      "No TELEGRAM_API_ID/HASH provided; using high-fidelity Mock Telegram Client for tracking simulation"
    );
    singletonClient = new MockTelegramClient();
  }

  return singletonClient;
}
