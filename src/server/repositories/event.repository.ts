import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents } from "@/db/schema";
import { generateEventKey } from "@/lib/crypto";
import type { EventType } from "@/types";

export interface CreateEventData {
  trackedAccountId: string;
  eventType: EventType;
  occurredAt: Date;
  source?: string;
  rawPayload?: Record<string, unknown>;
}

export class EventRepository {
  /**
   * Idempotently create an activity event. If the event already exists within the same second, it is skipped.
   */
  static async create(data: CreateEventData) {
    const key = generateEventKey(
      data.trackedAccountId,
      data.eventType,
      data.occurredAt.getTime()
    );

    const [event] = await db
      .insert(activityEvents)
      .values({
        trackedAccountId: data.trackedAccountId,
        eventType: data.eventType,
        occurredAt: data.occurredAt,
        source: data.source || "mtproto_event",
        idempotencyKey: key,
        rawPayload: data.rawPayload || {},
      })
      .onConflictDoNothing({ target: activityEvents.idempotencyKey })
      .returning();

    return event || null;
  }

  static async listRecent(trackedAccountId: string, limit: number = 50) {
    return await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.trackedAccountId, trackedAccountId))
      .orderBy(desc(activityEvents.occurredAt))
      .limit(limit);
  }

  static async listByTimeRange(
    trackedAccountId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await db
      .select()
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.trackedAccountId, trackedAccountId),
          gte(activityEvents.occurredAt, startDate),
          lte(activityEvents.occurredAt, endDate)
        )
      )
      .orderBy(activityEvents.occurredAt);
  }
}
