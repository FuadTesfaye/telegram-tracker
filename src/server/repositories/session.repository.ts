import { eq, and, desc, gte, lte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { activitySessions } from "@/db/schema";
import type { SessionConfidence } from "@/types";

export interface CreateSessionData {
  trackedAccountId: string;
  startedAt: Date;
  endedAt?: Date | null;
  durationSeconds?: number | null;
  isOpen?: boolean;
  confidence?: SessionConfidence;
  source?: string;
}

export class SessionRepository {
  static async findById(id: string) {
    const rows = await db
      .select()
      .from(activitySessions)
      .where(eq(activitySessions.id, id))
      .limit(1);
    return rows[0] || null;
  }

  static async findOpenSession(trackedAccountId: string) {
    const rows = await db
      .select()
      .from(activitySessions)
      .where(
        and(
          eq(activitySessions.trackedAccountId, trackedAccountId),
          eq(activitySessions.isOpen, true)
        )
      )
      .orderBy(desc(activitySessions.startedAt))
      .limit(1);
    return rows[0] || null;
  }

  static async create(data: CreateSessionData) {
    const [session] = await db
      .insert(activitySessions)
      .values({
        trackedAccountId: data.trackedAccountId,
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
        durationSeconds: data.durationSeconds ?? null,
        isOpen: data.isOpen ?? (data.endedAt ? false : true),
        confidence: data.confidence ?? "HIGH",
        source: data.source ?? "realtime",
      })
      .returning();
    return session;
  }

  static async closeSession(
    id: string,
    endedAt: Date,
    durationSeconds: number,
    confidence?: SessionConfidence,
    source?: string
  ) {
    const [updated] = await db
      .update(activitySessions)
      .set({
        endedAt,
        durationSeconds,
        isOpen: false,
        confidence: confidence || "HIGH",
        source: source || "realtime",
        updatedAt: new Date(),
      })
      .where(eq(activitySessions.id, id))
      .returning();
    return updated;
  }

  static async listRecentByAccount(trackedAccountId: string, limit: number = 30) {
    return await db
      .select()
      .from(activitySessions)
      .where(eq(activitySessions.trackedAccountId, trackedAccountId))
      .orderBy(desc(activitySessions.startedAt))
      .limit(limit);
  }

  static async listByDateRange(
    trackedAccountId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await db
      .select()
      .from(activitySessions)
      .where(
        and(
          eq(activitySessions.trackedAccountId, trackedAccountId),
          gte(activitySessions.startedAt, startDate),
          lte(activitySessions.startedAt, endDate)
        )
      )
      .orderBy(activitySessions.startedAt);
  }

  static async listAllOpenSessions() {
    return await db
      .select()
      .from(activitySessions)
      .where(eq(activitySessions.isOpen, true));
  }
}
