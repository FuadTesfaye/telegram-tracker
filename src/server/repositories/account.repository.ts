import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { trackedAccounts, users } from "@/db/schema";
import type { TrackingStatus, LastSeenStatus } from "@/types";

export interface CreateAccountData {
  ownerUserId: string;
  telegramUserId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  label?: string;
  notes?: string;
}

export class AccountRepository {
  static async findById(id: string) {
    const rows = await db
      .select()
      .from(trackedAccounts)
      .where(eq(trackedAccounts.id, id))
      .limit(1);
    return rows[0] || null;
  }

  static async findByOwnerAndTelegramUserId(ownerUserId: string, telegramUserId: number) {
    const rows = await db
      .select()
      .from(trackedAccounts)
      .where(
        and(
          eq(trackedAccounts.ownerUserId, ownerUserId),
          eq(trackedAccounts.telegramUserId, telegramUserId)
        )
      )
      .limit(1);
    return rows[0] || null;
  }

  static async findByOwnerAndUsername(ownerUserId: string, username: string) {
    const rows = await db
      .select()
      .from(trackedAccounts)
      .where(
        and(
          eq(trackedAccounts.ownerUserId, ownerUserId),
          eq(trackedAccounts.username, username.toLowerCase())
        )
      )
      .limit(1);
    return rows[0] || null;
  }

  static async listByOwner(ownerUserId: string) {
    return await db
      .select()
      .from(trackedAccounts)
      .where(eq(trackedAccounts.ownerUserId, ownerUserId))
      .orderBy(trackedAccounts.createdAt);
  }

  static async listAllActive() {
    return await db
      .select()
      .from(trackedAccounts)
      .where(eq(trackedAccounts.trackingStatus, "active"));
  }

  static async create(data: CreateAccountData) {
    const displayName =
      data.displayName ||
      [data.firstName, data.lastName].filter(Boolean).join(" ") ||
      data.username ||
      `User ${data.telegramUserId}`;

    const [account] = await db
      .insert(trackedAccounts)
      .values({
        ownerUserId: data.ownerUserId,
        telegramUserId: data.telegramUserId,
        username: data.username ? data.username.toLowerCase() : null,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName,
        label: data.label || "Other",
        notes: data.notes,
        trackingStatus: "active",
        trackingStartedAt: new Date(),
        lastSeenStatus: "unknown",
      })
      .returning();
    return account;
  }

  static async updateStatus(
    id: string,
    status: TrackingStatus,
    stoppedAt?: Date | null
  ) {
    const [account] = await db
      .update(trackedAccounts)
      .set({
        trackingStatus: status,
        trackingStoppedAt: stoppedAt !== undefined ? stoppedAt : (status === "stopped" ? new Date() : null),
        updatedAt: new Date(),
      })
      .where(eq(trackedAccounts.id, id))
      .returning();
    return account;
  }

  static async updatePresence(
    id: string,
    lastSeenStatus: LastSeenStatus,
    lastSeenAt?: Date
  ) {
    const [account] = await db
      .update(trackedAccounts)
      .set({
        lastSeenStatus,
        lastSeenAt: lastSeenAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trackedAccounts.id, id))
      .returning();
    return account;
  }

  static async updateMetadata(
    id: string,
    data: { label?: string; notes?: string; displayName?: string }
  ) {
    const [account] = await db
      .update(trackedAccounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(trackedAccounts.id, id))
      .returning();
    return account;
  }

  static async delete(id: string) {
    const [deleted] = await db
      .delete(trackedAccounts)
      .where(eq(trackedAccounts.id, id))
      .returning();
    return deleted;
  }
}
