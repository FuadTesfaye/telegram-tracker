import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  DB_URL_1: z.string().optional(),
  DB_URL_2: z.string().optional(),
  DB_URL_3: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_API_ID: z.string().default("36049913"),
  TELEGRAM_API_HASH: z.string().default("e74c1ddae57214cc7f66dfa54395eefb"),
  TELEGRAM_USERBOT_SESSION: z.string().optional(),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().default("lurkening_bot"),
  SESSION_SECRET: z.string().default("sec_jwtSecretKeyForDagmawiDispatchBroadsheet2026"),
  SESSION_ENCRYPTION_KEY: z.string().default("sec_jwtSecretKeyForDagmawiDispatchBroadsheet2026"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.includes("localhost") || val.includes("127.0.0.1") || !val.startsWith("http")) {
        if (process.env.VERCEL_URL) {
          return `https://${process.env.VERCEL_URL}`;
        }
        return "https://telegram-tracker-alpha.vercel.app";
      }
      if (val.startsWith("http://")) {
        return val.replace("http://", "https://");
      }
      return val;
    })
    .default("https://telegram-tracker-alpha.vercel.app"),
  TELEGRAM_WEBHOOK_SECRET: z.string().default("sec_r3nd0m1z3dW3bh00kS3cr3tForDagmawi"),
  CRON_SECRET: z.string().default("sec_r3nd0m1z3dCr0nS3cr3tForDagmawi"),
  GROQ_API_KEY_1: z.string().optional(),
  GROQ_API_KEY_2: z.string().optional(),
  GROQ_API_KEY_3: z.string().optional(),
  GROQ_API_KEY_4: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
