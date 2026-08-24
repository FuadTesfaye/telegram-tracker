import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyActivity } from "@/db/schema";
import type { CoverageStatus } from "@/types";

export interface UpsertDailyData {
  trackedAccountId: string;
  date: string; // YYYY-MM-DD
  activeSeconds: number;
  sessionCount: number;
  averageSessionSeconds: number;
  medianSessionSeconds: number;
  longestSessionSeconds: number;
  shortestSessionSeconds: number;
  firstSeenAt?: Date | null;
  lastSeenAt?: Date | null;
  peakHour: number;
  coverageStatus: CoverageStatus;
}

export class DailyRepository {
  static async findByAccountAndDate(trackedAccountId: string, date: string) {
    const rows = await db
      .select()
      .from(dailyActivity)
      .where(
        and(
          eq(dailyActivity.trackedAccountId, trackedAccountId),
          eq(dailyActivity.date, date)
        )
      )
      .limit(1);
    return rows[0] || null;
  }

  static async upsert(data: UpsertDailyData) {
    const [row] = await db
      .insert(dailyActivity)
      .values({
        trackedAccountId: data.trackedAccountId,
        date: data.date,
        activeSeconds: data.activeSeconds,
        sessionCount: data.sessionCount,
        averageSessionSeconds: data.averageSessionSeconds,
        medianSessionSeconds: data.medianSessionSeconds,
        longestSessionSeconds: data.longestSessionSeconds,
        shortestSessionSeconds: data.shortestSessionSeconds,
        firstSeenAt: data.firstSeenAt,
        lastSeenAt: data.lastSeenAt,
        peakHour: data.peakHour,
        coverageStatus: data.coverageStatus,
      })
      .onConflictDoUpdate({
        target: [dailyActivity.trackedAccountId, dailyActivity.date],
        set: {
          activeSeconds: data.activeSeconds,
          sessionCount: data.sessionCount,
          averageSessionSeconds: data.averageSessionSeconds,
          medianSessionSeconds: data.medianSessionSeconds,
          longestSessionSeconds: data.longestSessionSeconds,
          shortestSessionSeconds: data.shortestSessionSeconds,
          firstSeenAt: data.firstSeenAt,
          lastSeenAt: data.lastSeenAt,
          peakHour: data.peakHour,
          coverageStatus: data.coverageStatus,
          updatedAt: new Date(),
        },
      })
      .returning();

    return row;
  }

  static async listByRange(
    trackedAccountId: string,
    startDate: string,
    endDate: string
  ) {
    return await db
      .select()
      .from(dailyActivity)
      .where(
        and(
          eq(dailyActivity.trackedAccountId, trackedAccountId),
          gte(dailyActivity.date, startDate),
          lte(dailyActivity.date, endDate)
        )
      )
      .orderBy(dailyActivity.date);
  }

  static async listRecentDays(trackedAccountId: string, days: number = 30) {
    return await db
      .select()
      .from(dailyActivity)
      .where(eq(dailyActivity.trackedAccountId, trackedAccountId))
      .orderBy(desc(dailyActivity.date))
      .limit(days);
  }
}
