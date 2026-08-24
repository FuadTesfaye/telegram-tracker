import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_API_ID: z.string().optional().default(""),
  TELEGRAM_API_HASH: z.string().optional().default(""),
  SESSION_ENCRYPTION_KEY: z.string().default("telemetr-32-byte-secret-encryption-key-pass!"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  TELEGRAM_WEBHOOK_SECRET: z.string().default("telemetr_webhook_secret_key"),
  CRON_SECRET: z.string().default("telemetr_cron_secret_key"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
