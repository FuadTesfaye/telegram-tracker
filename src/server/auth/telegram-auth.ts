import crypto from "crypto";
import { env } from "@/lib/env";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ValidatedInitData {
  user: TelegramWebAppUser;
  authDate: number;
  queryId?: string;
}

/**
 * Cryptographically verifies Telegram Mini App initData string using HMAC-SHA256
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string = env.TELEGRAM_BOT_TOKEN
): ValidatedInitData | null {
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    params.delete("hash");

    // Sort parameters alphabetically
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join("\n");

    // 1. secret_key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // 2. calculated_hash = HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return null;
    }

    const userRaw = params.get("user");
    if (!userRaw) return null;

    const user = JSON.parse(userRaw) as TelegramWebAppUser;
    const authDate = parseInt(params.get("auth_date") || "0", 10);

    return {
      user,
      authDate,
      queryId: params.get("query_id") || undefined,
    };
  } catch (error) {
    return null;
  }
}
