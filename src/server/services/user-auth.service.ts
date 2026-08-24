import { TelegramClient } from "telegram";
import { Api } from "telegram/tl/index.js";
import { StringSession } from "telegram/sessions/index.js";
import { db } from "@/db";
import { mtprotoSessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { encryptData } from "@/lib/crypto";
import { logger } from "@/lib/logger";

// Temporary in-memory pending client sessions during phone code verification
const pendingLogins = new Map<string, { client: TelegramClient; phoneCodeHash: string; phone: string }>();

export class UserAuthService {
  /**
   * Step 1: Send Telegram authentication code to user's phone number
   */
  static async sendAuthCode(userId: string, phoneNumber: string): Promise<{ phoneCodeHash: string }> {
    const apiId = parseInt(env.TELEGRAM_API_ID, 10);
    const apiHash = env.TELEGRAM_API_HASH;

    const stringSession = new StringSession("");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({}),
      })
    );

    const phoneCodeHash = (result as any).phoneCodeHash;

    pendingLogins.set(userId, {
      client,
      phoneCodeHash,
      phone: phoneNumber,
    });

    logger.info("Sent Telegram authentication code to user", { userId, phoneNumber });
    return { phoneCodeHash };
  }

  /**
   * Step 2: Sign in with code (+ optional 2FA password) and store encrypted session
   */
  static async verifyCodeAndSignIn(
    userId: string,
    code: string,
    password?: string
  ): Promise<{ success: boolean; sessionName: string }> {
    const pending = pendingLogins.get(userId);
    if (!pending) {
      throw new Error("No pending login session found. Please request a new code.");
    }

    const { client, phoneCodeHash, phone } = pending;

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash,
          phoneCode: code,
        })
      );

      const sessionString = (client.session as StringSession).save();
      const encryptedSession = encryptData(sessionString);
      const sessionName = `user_${userId}`;

      // Save encrypted session in database
      await db
        .insert(mtprotoSessions)
        .values({
          userId,
          sessionName,
          phoneOrAccount: phone,
          encryptedSessionData: encryptedSession,
          isActive: true,
          lastConnectedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: mtprotoSessions.sessionName,
          set: {
            encryptedSessionData: encryptedSession,
            isActive: true,
            lastConnectedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      // Mark user as self-tracked
      await db
        .update(users)
        .set({
          isSelfTracked: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      pendingLogins.delete(userId);
      logger.info("User Telegram account successfully connected & authorized", { userId });

      return { success: true, sessionName };
    } catch (err: any) {
      logger.error("Failed to verify Telegram login code", { userId, error: err });
      throw new Error(err.message || "Failed to verify Telegram code");
    }
  }

  /**
   * Disconnect / Revoke self-tracked MTProto session
   */
  static async disconnectUserSession(userId: string) {
    const sessionName = `user_${userId}`;
    await db.delete(mtprotoSessions).where(eq(mtprotoSessions.sessionName, sessionName));
    await db.update(users).set({ isSelfTracked: false }).where(eq(users.id, userId));
    logger.info("User Telegram session revoked", { userId });
  }
}
