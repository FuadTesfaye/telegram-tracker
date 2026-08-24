import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import type {
  TelegramTrackingClient,
  PresenceCallback,
} from "./telegram-client.interface";
import type { TelegramTarget, TelegramPresence, LastSeenStatus } from "@/types";
import { normalizeUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";

export class GramJsTelegramClient implements TelegramTrackingClient {
  private client: TelegramClient | null = null;
  private apiId: number;
  private apiHash: string;
  private sessionString: string;
  private connected: boolean = false;
  private trackedTargets = new Map<number, { target: TelegramTarget; cb: PresenceCallback }>();

  constructor(apiId: number, apiHash: string, sessionString: string = "") {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.sessionString = sessionString;
  }

  async connect(): Promise<void> {
    if (this.client && this.connected) return;

    const stringSession = new StringSession(this.sessionString);
    this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
      connectionRetries: 5,
      useWSS: false,
    });

    await this.client.connect();
    this.connected = true;
    logger.info("GramJS MTProto Client successfully connected to Telegram");

    // Register global user status update handler
    this.client.addEventHandler(async (update: any) => {
      try {
        if (update?.className === "UpdateUserStatus") {
          const userId = Number(update.userId);
          const tracker = this.trackedTargets.get(userId);
          if (tracker) {
            const presence = this.mapTelegramStatus(update.status);
            await tracker.cb(tracker.target, presence);
          }
        }
      } catch (err) {
        logger.error("Error processing GramJS MTProto update", { error: err });
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
      this.client = null;
      logger.info("GramJS MTProto Client disconnected");
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async resolveUsername(input: string): Promise<TelegramTarget | null> {
    if (!this.client || !this.connected) {
      await this.connect();
    }
    const username = normalizeUsername(input);
    if (!username) return null;

    try {
      const result = await this.client!.invoke(
        new Api.contacts.ResolveUsername({
          username,
        })
      );

      if (result.users && result.users.length > 0) {
        const user = result.users[0] as any;
        return {
          telegramUserId: Number(user.id),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          accessHash: user.accessHash ? user.accessHash.toString() : undefined,
          phone: user.phone,
        };
      }
      return null;
    } catch (error: any) {
      logger.warn("Failed to resolve Telegram username via MTProto", {
        username,
        error: error?.message || error,
      });
      return null;
    }
  }

  async getStatus(target: TelegramTarget): Promise<TelegramPresence> {
    if (!this.client || !this.connected) {
      await this.connect();
    }

    try {
      const users = await this.client!.invoke(
        new Api.users.GetUsers({
          id: [new Api.InputUser({ userId: target.telegramUserId as any, accessHash: target.accessHash as any || 0n as any })],
        })
      );

      if (users && users.length > 0) {
        const user = users[0] as any;
        return this.mapTelegramStatus(user.status);
      }
    } catch (err) {
      logger.warn("Failed to get direct user status via MTProto", {
        userId: target.telegramUserId,
        error: err,
      });
    }

    return {
      status: "unknown",
      isOnline: false,
    };
  }

  async startTracking(
    target: TelegramTarget,
    onPresenceChange: PresenceCallback
  ): Promise<void> {
    this.trackedTargets.set(target.telegramUserId, {
      target,
      cb: onPresenceChange,
    });
    logger.info("Registered MTProto presence listener for user", {
      userId: target.telegramUserId,
      username: target.username,
    });
  }

  async stopTracking(target: TelegramTarget): Promise<void> {
    this.trackedTargets.delete(target.telegramUserId);
    logger.info("Removed MTProto presence listener for user", {
      userId: target.telegramUserId,
    });
  }

  private mapTelegramStatus(status: any): TelegramPresence {
    if (!status) {
      return { status: "unknown", isOnline: false };
    }

    switch (status.className) {
      case "UserStatusOnline":
        return {
          status: "online",
          isOnline: true,
          expiresAt: status.expires ? new Date(status.expires * 1000) : undefined,
          lastSeenAt: new Date(),
        };
      case "UserStatusOffline":
        return {
          status: "offline",
          isOnline: false,
          lastSeenAt: status.wasOnline ? new Date(status.wasOnline * 1000) : new Date(),
        };
      case "UserStatusRecently":
        return { status: "recently", isOnline: false };
      case "UserStatusLastWeek":
        return { status: "last_week", isOnline: false };
      case "UserStatusLastMonth":
        return { status: "last_month", isOnline: false };
      default:
        return { status: "unknown", isOnline: false };
    }
  }
}
