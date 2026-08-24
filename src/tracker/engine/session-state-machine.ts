import { EventRepository } from "@/server/repositories/event.repository";
import { SessionRepository } from "@/server/repositories/session.repository";
import { AccountRepository } from "@/server/repositories/account.repository";
import { Aggregator } from "./aggregator";
import type { EventType, TelegramPresence } from "@/types";
import { logger } from "@/lib/logger";

export class SessionStateMachine {
  /**
   * Processes an incoming presence status change for a tracked account
   */
  static async handlePresenceChange(
    trackedAccountId: string,
    presence: TelegramPresence
  ) {
    const occurredAt = presence.lastSeenAt || new Date();
    const eventType: EventType = presence.isOnline ? "ONLINE" : "OFFLINE";

    // 1. Persist raw event idempotently
    await EventRepository.create({
      trackedAccountId,
      eventType,
      occurredAt,
      source: "mtproto_event",
      rawPayload: { presence },
    });

    // 2. Update tracked_accounts table presence
    await AccountRepository.updatePresence(
      trackedAccountId,
      presence.status,
      occurredAt
    );

    // 3. State machine transition logic
    if (eventType === "ONLINE") {
      await this.handleOnlineEvent(trackedAccountId, occurredAt);
    } else {
      await this.handleOfflineEvent(trackedAccountId, occurredAt);
    }
  }

  private static async handleOnlineEvent(
    trackedAccountId: string,
    occurredAt: Date
  ) {
    const existingOpenSession = await SessionRepository.findOpenSession(
      trackedAccountId
    );

    if (!existingOpenSession) {
      // Create new open session
      logger.info("Opening new active activity session", {
        trackedAccountId,
        startedAt: occurredAt,
      });

      await SessionRepository.create({
        trackedAccountId,
        startedAt: occurredAt,
        isOpen: true,
        confidence: "HIGH",
        source: "realtime",
      });
    } else {
      // Account is already in an open session; treat as continuing presence heartbeat
      logger.debug("Heartbeat for existing open session", {
        sessionId: existingOpenSession.id,
        trackedAccountId,
      });
    }
  }

  private static async handleOfflineEvent(
    trackedAccountId: string,
    occurredAt: Date
  ) {
    const openSession = await SessionRepository.findOpenSession(trackedAccountId);

    if (openSession) {
      // Determine session duration
      let endedAt = occurredAt;
      if (endedAt.getTime() < openSession.startedAt.getTime()) {
        // Clock skew adjustment: minimum 10 seconds
        endedAt = new Date(openSession.startedAt.getTime() + 10000);
      }

      const durationSeconds = Math.max(
        1,
        Math.round((endedAt.getTime() - openSession.startedAt.getTime()) / 1000)
      );

      logger.info("Closing active activity session", {
        sessionId: openSession.id,
        trackedAccountId,
        durationSeconds,
      });

      await SessionRepository.closeSession(
        openSession.id,
        endedAt,
        durationSeconds,
        "HIGH",
        "realtime"
      );

      // Rollup into daily and hourly statistics
      await Aggregator.processSession(
        trackedAccountId,
        openSession.startedAt,
        endedAt
      );
    } else {
      logger.debug("Received OFFLINE event without an open session; ignoring", {
        trackedAccountId,
      });
    }
  }
}
