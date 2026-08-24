import { SessionRepository } from "@/server/repositories/session.repository";
import { Aggregator } from "./aggregator";
import { logger } from "@/lib/logger";

const MAX_SESSION_DURATION_SECONDS = 3 * 3600; // 3 hours max continuous presence before stale capping
const DEFAULT_CAPPED_DURATION_SECONDS = 15 * 60; // 15 mins default fallback if no heartbeat

export class StaleReconciler {
  /**
   * Scans for open sessions that have exceeded the safety threshold and closes them
   */
  static async reconcileStaleSessions(maxAgeMs: number = MAX_SESSION_DURATION_SECONDS * 1000): Promise<number> {
    const openSessions = await SessionRepository.listAllOpenSessions();
    const now = Date.now();
    let reconciledCount = 0;

    for (const session of openSessions) {
      const elapsedMs = now - session.startedAt.getTime();

      if (elapsedMs > maxAgeMs) {
        const cappedEndTime = new Date(
          session.startedAt.getTime() + DEFAULT_CAPPED_DURATION_SECONDS * 1000
        );
        const durationSeconds = DEFAULT_CAPPED_DURATION_SECONDS;

        logger.warn("Reconciling dangling stale session", {
          sessionId: session.id,
          trackedAccountId: session.trackedAccountId,
          startedAt: session.startedAt,
          durationSeconds,
        });

        await SessionRepository.closeSession(
          session.id,
          cappedEndTime,
          durationSeconds,
          "MEDIUM",
          "reconciled_stale"
        );

        await Aggregator.processSession(
          session.trackedAccountId,
          session.startedAt,
          cappedEndTime
        );

        reconciledCount++;
      }
    }

    return reconciledCount;
  }
}
