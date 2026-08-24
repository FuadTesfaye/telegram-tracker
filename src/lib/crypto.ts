import crypto from "crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  return crypto.createHash("sha256").update(env.SESSION_ENCRYPTION_KEY).digest();
}

/**
 * Encrypt sensitive session data at rest using AES-256-GCM
 */
export function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM encrypted data
 */
export function decryptData(cipherText: string): string {
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid cipher text format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Generate a deterministic event idempotency key to prevent duplicate status processing
 */
export function generateEventKey(
  trackedAccountId: string,
  eventType: string,
  timestampMs: number
): string {
  const second = Math.floor(timestampMs / 1000);
  return crypto
    .createHash("sha256")
    .update(`${trackedAccountId}:${eventType}:${second}`)
    .digest("hex");
}
