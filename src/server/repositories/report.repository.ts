import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import type { ReportPeriod } from "@/types";

export interface CreateReportData {
  userId: string;
  trackedAccountId?: string;
  periodType: ReportPeriod;
  periodStart: Date;
  periodEnd: Date;
  payload: Record<string, unknown>;
}

export class ReportRepository {
  static async create(data: CreateReportData) {
    const [report] = await db
      .insert(reports)
      .values({
        userId: data.userId,
        trackedAccountId: data.trackedAccountId ?? null,
        periodType: data.periodType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        payload: data.payload,
      })
      .returning();
    return report;
  }

  static async listByUser(userId: string, limit: number = 20) {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.generatedAt))
      .limit(limit);
  }

  static async getLatest(userId: string, periodType: ReportPeriod) {
    const rows = await db
      .select()
      .from(reports)
      .where(and(eq(reports.userId, userId), eq(reports.periodType, periodType)))
      .orderBy(desc(reports.generatedAt))
      .limit(1);
    return rows[0] || null;
  }
}
