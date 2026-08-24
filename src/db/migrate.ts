import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be defined");
}

const statements = [
  // 1. Extend existing users table if present
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id bigint;`,
  `UPDATE users SET telegram_id = CAST(telegram_user_id AS bigint) WHERE telegram_id IS NULL AND telegram_user_id IS NOT NULL AND telegram_user_id ~ '^[0-9]+$';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS language_code varchar(10) DEFAULT 'en';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone varchar(64) DEFAULT 'UTC' NOT NULL;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan varchar(32) DEFAULT 'free' NOT NULL;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_self_tracked boolean DEFAULT false NOT NULL;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id_unique ON users(telegram_id) WHERE telegram_id IS NOT NULL;`,

  // 2. tracked_accounts
  `CREATE TABLE IF NOT EXISTS tracked_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id bigint NOT NULL,
    username varchar(255),
    first_name varchar(255),
    last_name varchar(255),
    display_name varchar(255),
    label varchar(64) DEFAULT 'Other',
    notes text,
    is_self_account boolean DEFAULT false NOT NULL,
    tracking_status varchar(32) DEFAULT 'active' NOT NULL,
    tracking_started_at timestamp with time zone DEFAULT now() NOT NULL,
    tracking_stopped_at timestamp with time zone,
    last_seen_status varchar(32) DEFAULT 'unknown' NOT NULL,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_tracked_owner ON tracked_accounts(owner_user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tracked_tg_user ON tracked_accounts(telegram_user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tracked_username ON tracked_accounts(username);`,
  `CREATE INDEX IF NOT EXISTS idx_tracked_status ON tracked_accounts(tracking_status);`,

  // 3. activity_events
  `CREATE TABLE IF NOT EXISTS activity_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    event_type varchar(32) NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    source varchar(32) DEFAULT 'mtproto_event' NOT NULL,
    idempotency_key varchar(255) NOT NULL UNIQUE,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_events_account_time ON activity_events(tracked_account_id, occurred_at);`,

  // 4. activity_sessions
  `CREATE TABLE IF NOT EXISTS activity_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    duration_seconds integer,
    is_open boolean DEFAULT true NOT NULL,
    confidence varchar(16) DEFAULT 'HIGH' NOT NULL,
    source varchar(32) DEFAULT 'realtime' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_account_start ON activity_sessions(tracked_account_id, started_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_account_end ON activity_sessions(tracked_account_id, ended_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_is_open ON activity_sessions(is_open);`,

  // 5. daily_activity
  `CREATE TABLE IF NOT EXISTS daily_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    date date NOT NULL,
    active_seconds integer DEFAULT 0 NOT NULL,
    session_count integer DEFAULT 0 NOT NULL,
    average_session_seconds integer DEFAULT 0 NOT NULL,
    median_session_seconds integer DEFAULT 0 NOT NULL,
    longest_session_seconds integer DEFAULT 0 NOT NULL,
    shortest_session_seconds integer DEFAULT 0 NOT NULL,
    first_seen_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    peak_hour integer DEFAULT 0 NOT NULL,
    coverage_status varchar(16) DEFAULT 'COMPLETE' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_account_date ON daily_activity(tracked_account_id, date);`,
  `CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_activity(date);`,

  // 6. hourly_activity
  `CREATE TABLE IF NOT EXISTS hourly_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    date date NOT NULL,
    hour integer NOT NULL,
    active_seconds integer DEFAULT 0 NOT NULL,
    session_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_account_date_hour ON hourly_activity(tracked_account_id, date, hour);`,

  // 7. telegram_chats
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

  // 8. chat_activity
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

  // 9. user_rivals
  `CREATE TABLE IF NOT EXISTS user_rivals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    rival_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 10. user_achievements
  `CREATE TABLE IF NOT EXISTS user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key varchar(64) NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_achievements_unique ON user_achievements(user_id, achievement_key);`,

  // 11. alerts
  `CREATE TABLE IF NOT EXISTS alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    type varchar(32) NOT NULL,
    threshold_seconds integer DEFAULT 3600 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    last_triggered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 12. reports
  `CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracked_account_id uuid REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    period_type varchar(16) NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    payload jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 13. user_settings
  `CREATE TABLE IF NOT EXISTS user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    timezone varchar(64) DEFAULT 'UTC' NOT NULL,
    daily_summary_enabled boolean DEFAULT true NOT NULL,
    daily_summary_time varchar(10) DEFAULT '21:00' NOT NULL,
    weekly_summary_enabled boolean DEFAULT true NOT NULL,
    weekly_summary_day integer DEFAULT 1 NOT NULL,
    alert_notifications_enabled boolean DEFAULT true NOT NULL,
    export_format_default varchar(10) DEFAULT 'csv' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 14. mtproto_sessions
  `CREATE TABLE IF NOT EXISTS mtproto_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_name varchar(64) NOT NULL UNIQUE,
    phone_or_account varchar(64),
    encrypted_session_data text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`
];

async function runMigration() {
  console.log("Connecting to PostgreSQL at", directUrl?.split("@")[1]);
  const sql = postgres(directUrl!, { max: 1, prepare: false });

  try {
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    console.log("✅ All 14 tables and indexes migrated successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
