import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be defined");
}

const statements = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_self_tracked boolean DEFAULT false NOT NULL;`,
  `ALTER TABLE tracked_accounts ADD COLUMN IF NOT EXISTS is_self_account boolean DEFAULT false NOT NULL;`,
  `ALTER TABLE mtproto_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;`,

  `CREATE TABLE IF NOT EXISTS telegram_chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_chat_id bigint NOT NULL,
    chat_type varchar(32) DEFAULT 'group' NOT NULL,
    title varchar(255) NOT NULL,
    username varchar(255),
    custom_label varchar(64),
    first_observed_at timestamp with time zone DEFAULT now() NOT NULL,
    last_observed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_chats_owner ON telegram_chats(owner_user_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_owner_tg_chat ON telegram_chats(owner_user_id, telegram_chat_id);`,

  `CREATE TABLE IF NOT EXISTS chat_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    chat_id uuid NOT NULL REFERENCES telegram_chats(id) ON DELETE CASCADE,
    date date NOT NULL,
    active_seconds integer DEFAULT 0 NOT NULL,
    message_count integer DEFAULT 0 NOT NULL,
    reply_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_chat_act_account ON chat_activity(tracked_account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_act_chat_date ON chat_activity(chat_id, date);`,

  `CREATE TABLE IF NOT EXISTS user_rivals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    rival_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key varchar(64) NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_achievements_unique ON user_achievements(user_id, achievement_key);`,
];

async function runMigration() {
  console.log("Connecting to Supabase PostgreSQL for table initialization...");
  const sql = postgres(directUrl!, { max: 1 });

  try {
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    console.log("✅ Extended database schema migrated successfully on Supabase!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
