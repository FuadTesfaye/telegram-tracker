import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import type { AlertType } from "@/types";

export interface CreateAlertData {
  userId: string;
  trackedAccountId: string;
  type: AlertType;
  thresholdSeconds?: number;
  enabled?: boolean;
}

export class AlertRepository {
  static async listByAccount(trackedAccountId: string) {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.trackedAccountId, trackedAccountId));
  }

  static async listByUser(userId: string) {
    return await db.select().from(alerts).where(eq(alerts.userId, userId));
  }

  static async create(data: CreateAlertData) {
    const [alert] = await db
      .insert(alerts)
      .values({
        userId: data.userId,
        trackedAccountId: data.trackedAccountId,
        type: data.type,
        thresholdSeconds: data.thresholdSeconds || 3600,
        enabled: data.enabled ?? true,
      })
      .returning();
    return alert;
  }

  static async updateTriggered(id: string) {
    const [alert] = await db
      .update(alerts)
      .set({
        lastTriggeredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  static async toggleEnabled(id: string, enabled: boolean) {
    const [alert] = await db
      .update(alerts)
      .set({
        enabled,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  static async delete(id: string) {
    const [deleted] = await db
      .delete(alerts)
      .where(eq(alerts.id, id))
      .returning();
    return deleted;
  }
}
