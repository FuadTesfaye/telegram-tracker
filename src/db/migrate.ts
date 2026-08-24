import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be defined");
}

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id bigint NOT NULL UNIQUE,
    username varchar(255),
    first_name varchar(255),
    last_name varchar(255),
    language_code varchar(10) DEFAULT 'en',
    timezone varchar(64) DEFAULT 'UTC' NOT NULL,
    plan varchar(32) DEFAULT 'free' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
  `CREATE TABLE IF NOT EXISTS user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    timezone varchar(64) DEFAULT 'UTC' NOT NULL,
    daily_summary_enabled boolean DEFAULT false NOT NULL,
    daily_summary_time varchar(10) DEFAULT '21:00' NOT NULL,
    weekly_summary_enabled boolean DEFAULT true NOT NULL,
    weekly_summary_day integer DEFAULT 1 NOT NULL,
    alert_notifications_enabled boolean DEFAULT true NOT NULL,
    export_format_default varchar(10) DEFAULT 'csv' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
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
  `CREATE TABLE IF NOT EXISTS activity_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    event_type varchar(32) NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    source varchar(32) DEFAULT 'mtproto_event' NOT NULL,
    idempotency_key varchar(255) UNIQUE NOT NULL,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_events_account_time ON activity_events(tracked_account_id, occurred_at);`,
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT idx_daily_account_date UNIQUE (tracked_account_id, date)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_activity(date);`,
  `CREATE TABLE IF NOT EXISTS hourly_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_account_id uuid NOT NULL REFERENCES tracked_accounts(id) ON DELETE CASCADE,
    date date NOT NULL,
    hour integer NOT NULL,
    active_seconds integer DEFAULT 0 NOT NULL,
    session_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT idx_hourly_account_date_hour UNIQUE (tracked_account_id, date, hour)
  );`,
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
  `CREATE INDEX IF NOT EXISTS idx_alerts_account ON alerts(tracked_account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);`,
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
  `CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_reports_account ON reports(tracked_account_id);`,
  `CREATE TABLE IF NOT EXISTS mtproto_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name varchar(64) UNIQUE NOT NULL,
    phone_or_account varchar(64),
    encrypted_session_data text NOT NULL,
    isActive boolean DEFAULT true NOT NULL,
    last_connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
];

async function runMigration() {
  console.log("Connecting to Supabase PostgreSQL for table initialization...");
  const sql = postgres(directUrl!, { max: 1 });

  try {
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    console.log("✅ Database schema migrated successfully on Supabase!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
