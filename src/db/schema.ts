import {
  pgTable,
  uuid,
  varchar,
  bigint,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 1. users
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
    username: varchar("username", { length: 255 }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    languageCode: varchar("language_code", { length: 10 }).default("en"),
    timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
    plan: varchar("plan", { length: 32 }).default("free").notNull(), // free, pro, enterprise
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_telegram_id").on(table.telegramId),
    index("idx_users_username").on(table.username),
  ]
);

// 2. tracked_accounts
export const trackedAccounts = pgTable(
  "tracked_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull(),
    username: varchar("username", { length: 255 }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    displayName: varchar("display_name", { length: 255 }),
    label: varchar("label", { length: 64 }).default("Other"),
    notes: text("notes"),
    trackingStatus: varchar("tracking_status", { length: 32 }).default("active").notNull(), // active, paused, stopped, restricted, error
    trackingStartedAt: timestamp("tracking_started_at", { withTimezone: true }).defaultNow().notNull(),
    trackingStoppedAt: timestamp("tracking_stopped_at", { withTimezone: true }),
    lastSeenStatus: varchar("last_seen_status", { length: 32 }).default("unknown").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_tracked_owner").on(table.ownerUserId),
    index("idx_tracked_tg_user").on(table.telegramUserId),
    index("idx_tracked_username").on(table.username),
    index("idx_tracked_status").on(table.trackingStatus),
  ]
);

// 3. activity_events
export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackedAccountId: uuid("tracked_account_id")
      .references(() => trackedAccounts.id, { onDelete: "cascade" })
      .notNull(),
    eventType: varchar("event_type", { length: 32 }).notNull(), // ONLINE, OFFLINE, STATUS_UNKNOWN, RESTRICTED
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    source: varchar("source", { length: 32 }).default("mtproto_event").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique().notNull(),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_events_account_time").on(table.trackedAccountId, table.occurredAt),
  ]
);

// 4. activity_sessions
export const activitySessions = pgTable(
  "activity_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackedAccountId: uuid("tracked_account_id")
      .references(() => trackedAccounts.id, { onDelete: "cascade" })
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    isOpen: boolean("is_open").default(true).notNull(),
    confidence: varchar("confidence", { length: 16 }).default("HIGH").notNull(), // HIGH, MEDIUM, LOW
    source: varchar("source", { length: 32 }).default("realtime").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_sessions_account_start").on(table.trackedAccountId, table.startedAt),
    index("idx_sessions_account_end").on(table.trackedAccountId, table.endedAt),
    index("idx_sessions_is_open").on(table.isOpen),
  ]
);

// 5. daily_activity
export const dailyActivity = pgTable(
  "daily_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackedAccountId: uuid("tracked_account_id")
      .references(() => trackedAccounts.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    activeSeconds: integer("active_seconds").default(0).notNull(),
    sessionCount: integer("session_count").default(0).notNull(),
    averageSessionSeconds: integer("average_session_seconds").default(0).notNull(),
    medianSessionSeconds: integer("median_session_seconds").default(0).notNull(),
    longestSessionSeconds: integer("longest_session_seconds").default(0).notNull(),
    shortestSessionSeconds: integer("shortest_session_seconds").default(0).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    peakHour: integer("peak_hour").default(0).notNull(), // 0-23
    coverageStatus: varchar("coverage_status", { length: 16 }).default("COMPLETE").notNull(), // COMPLETE, PARTIAL, MISSING
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_daily_account_date").on(table.trackedAccountId, table.date),
    index("idx_daily_date").on(table.date),
  ]
);

// 6. hourly_activity
export const hourlyActivity = pgTable(
  "hourly_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackedAccountId: uuid("tracked_account_id")
      .references(() => trackedAccounts.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    hour: integer("hour").notNull(), // 0-23
    activeSeconds: integer("active_seconds").default(0).notNull(),
    sessionCount: integer("session_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_hourly_account_date_hour").on(table.trackedAccountId, table.date, table.hour),
  ]
);

// 7. alerts
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    trackedAccountId: uuid("tracked_account_id")
      .references(() => trackedAccounts.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 32 }).notNull(), // LONG_SESSION, UNUSUALLY_HIGH_ACTIVITY, UNUSUALLY_LOW_ACTIVITY, TRACKING_STOPPED, TRACKING_RESUMED
    thresholdSeconds: integer("threshold_seconds").default(3600).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_alerts_account").on(table.trackedAccountId),
    index("idx_alerts_user").on(table.userId),
  ]
);

// 8. reports
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    trackedAccountId: uuid("tracked_account_id").references(() => trackedAccounts.id, {
      onDelete: "cascade",
    }),
    periodType: varchar("period_type", { length: 16 }).notNull(), // DAILY, WEEKLY, MONTHLY
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    payload: jsonb("payload").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_reports_user").on(table.userId),
    index("idx_reports_account").on(table.trackedAccountId),
  ]
);

// 9. user_settings
export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .unique()
      .notNull(),
    timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
    dailySummaryEnabled: boolean("daily_summary_enabled").default(false).notNull(),
    dailySummaryTime: varchar("daily_summary_time", { length: 10 }).default("21:00").notNull(),
    weeklySummaryEnabled: boolean("weekly_summary_enabled").default(true).notNull(),
    weeklySummaryDay: integer("weekly_summary_day").default(1).notNull(), // Monday
    alertNotificationsEnabled: boolean("alert_notifications_enabled").default(true).notNull(),
    exportFormatDefault: varchar("export_format_default", { length: 10 }).default("csv").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// 10. mtproto_sessions
export const mtprotoSessions = pgTable(
  "mtproto_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionName: varchar("session_name", { length: 64 }).unique().notNull(),
    phoneOrAccount: varchar("phone_or_account", { length: 64 }),
    encryptedSessionData: text("encrypted_session_data").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);
