import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_API_ID: z.string().default("36049913"),
  TELEGRAM_API_HASH: z.string().default("e74c1ddae57214cc7f66dfa54395eefb"),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().default("lurkening_bot"),
  SESSION_SECRET: z.string().default("sec_jwtSecretKeyForDagmawiDispatchBroadsheet2026"),
  SESSION_ENCRYPTION_KEY: z.string().default("sec_jwtSecretKeyForDagmawiDispatchBroadsheet2026"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .default(
      process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://telegram-tracker-alpha.vercel.app")
    ),
  TELEGRAM_WEBHOOK_SECRET: z.string().default("telemetr_webhook_secret_key"),
  CRON_SECRET: z.string().default("telemetr_cron_secret_key"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
