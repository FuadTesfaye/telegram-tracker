import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userSettings } from "@/db/schema";

export interface CreateUserData {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  timezone?: string;
}

export class UserRepository {
  static async findByTelegramId(telegramId: number) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    return rows[0] || null;
  }

  static async findById(id: string) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] || null;
  }

  static async findOrCreate(data: CreateUserData) {
    const existing = await this.findByTelegramId(data.telegramId);
    if (existing) {
      // Update profile info if changed
      const [updated] = await db
        .update(users)
        .set({
          username: data.username ?? existing.username,
          firstName: data.firstName ?? existing.firstName,
          lastName: data.lastName ?? existing.lastName,
          languageCode: data.languageCode ?? existing.languageCode,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }

    // Create user and default settings in a single flow
    const [newUser] = await db
      .insert(users)
      .values({
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode || "en",
        timezone: data.timezone || "UTC",
        plan: "free",
      })
      .returning();

    await db
      .insert(userSettings)
      .values({
        userId: newUser.id,
        timezone: data.timezone || "UTC",
      })
      .onConflictDoNothing();

    return newUser;
  }

  static async getUserSettings(userId: string) {
    const rows = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return rows[0] || null;
  }

  static async updateUserSettings(
    userId: string,
    settings: Partial<typeof userSettings.$inferInsert>
  ) {
    const [updated] = await db
      .insert(userSettings)
      .values({
        userId,
        ...settings,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updated;
  }
}
