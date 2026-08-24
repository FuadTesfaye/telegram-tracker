import type {
  TelegramTrackingClient,
  PresenceCallback,
} from "./telegram-client.interface";
import type { TelegramTarget, TelegramPresence, LastSeenStatus } from "@/types";
import { normalizeUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";

export class MockTelegramClient implements TelegramTrackingClient {
  private connected: boolean = false;
  private trackedTargets = new Map<number, { target: TelegramTarget; cb: PresenceCallback; timer?: NodeJS.Timeout }>();

  async connect(): Promise<void> {
    this.connected = true;
    logger.info("Mock Telegram MTProto client connected (Simulation mode)");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    for (const [id, item] of this.trackedTargets.entries()) {
      if (item.timer) clearInterval(item.timer);
    }
    this.trackedTargets.clear();
    logger.info("Mock Telegram MTProto client disconnected");
  }

  isConnected(): boolean {
    return this.connected;
  }

  async resolveUsername(input: string): Promise<TelegramTarget | null> {
    const username = normalizeUsername(input);
    if (!username || username.length < 3) return null;

    // Generate a deterministic stable Telegram user ID based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash << 5) - hash + username.charCodeAt(i);
      hash |= 0;
    }
    const telegramUserId = Math.abs(hash) + 100000000;

    const capitalized = username.charAt(0).toUpperCase() + username.slice(1);

    return {
      telegramUserId,
      username,
      firstName: capitalized,
      lastName: "Account",
      accessHash: "mock_access_hash_" + telegramUserId,
    };
  }

  async getStatus(target: TelegramTarget): Promise<TelegramPresence> {
    // Generate an initial realistic status
    const isOnline = Math.random() > 0.6;
    return {
      status: isOnline ? "online" : "offline",
      isOnline,
      lastSeenAt: isOnline ? new Date() : new Date(Date.now() - 15 * 60 * 1000),
    };
  }

  async startTracking(
    target: TelegramTarget,
    onPresenceChange: PresenceCallback
  ): Promise<void> {
    if (this.trackedTargets.has(target.telegramUserId)) {
      return;
    }

    logger.info("Starting mock observation for target", {
      userId: target.telegramUserId,
      username: target.username,
    });

    let isCurrentlyOnline = false;

    // Simulation loop: intermittently toggle online/offline state to simulate natural activity
    const timer = setInterval(async () => {
      if (!this.connected) return;

      // 30% chance to toggle state every check
      if (Math.random() < 0.35) {
        isCurrentlyOnline = !isCurrentlyOnline;
        const presence: TelegramPresence = {
          status: isCurrentlyOnline ? "online" : "offline",
          isOnline: isCurrentlyOnline,
          lastSeenAt: new Date(),
        };

        try {
          await onPresenceChange(target, presence);
        } catch (err) {
          logger.error("Error dispatching mock presence update", { error: err });
        }
      }
    }, 45000); // Check every 45s

    this.trackedTargets.set(target.telegramUserId, {
      target,
      cb: onPresenceChange,
      timer,
    });
  }

  async stopTracking(target: TelegramTarget): Promise<void> {
    const existing = this.trackedTargets.get(target.telegramUserId);
    if (existing?.timer) {
      clearInterval(existing.timer);
    }
    this.trackedTargets.delete(target.telegramUserId);
    logger.info("Stopped mock observation for target", {
      userId: target.telegramUserId,
    });
  }
}
