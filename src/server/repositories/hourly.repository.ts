import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { hourlyActivity } from "@/db/schema";

export interface UpsertHourlyData {
  trackedAccountId: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  activeSeconds: number;
  sessionCount: number;
}

export class HourlyRepository {
  static async upsert(data: UpsertHourlyData) {
    const [row] = await db
      .insert(hourlyActivity)
      .values({
        trackedAccountId: data.trackedAccountId,
        date: data.date,
        hour: data.hour,
        activeSeconds: data.activeSeconds,
        sessionCount: data.sessionCount,
      })
      .onConflictDoUpdate({
        target: [
          hourlyActivity.trackedAccountId,
          hourlyActivity.date,
          hourlyActivity.hour,
        ],
        set: {
          activeSeconds: data.activeSeconds,
          sessionCount: data.sessionCount,
          updatedAt: new Date(),
        },
      })
      .returning();

    return row;
  }

  static async getHourlyDistribution(
    trackedAccountId: string,
    startDate: string,
    endDate: string
  ) {
    const rows = await db
      .select({
        hour: hourlyActivity.hour,
        totalActiveSeconds: sql<number>`COALESCE(SUM(${hourlyActivity.activeSeconds}), 0)`,
        totalSessionCount: sql<number>`COALESCE(SUM(${hourlyActivity.sessionCount}), 0)`,
      })
      .from(hourlyActivity)
      .where(
        and(
          eq(hourlyActivity.trackedAccountId, trackedAccountId),
          gte(hourlyActivity.date, startDate),
          lte(hourlyActivity.date, endDate)
        )
      )
      .groupBy(hourlyActivity.hour)
      .orderBy(hourlyActivity.hour);

    return rows;
  }
}
