export type UserPlan = "free" | "pro" | "enterprise";

export type TrackingStatus = "active" | "paused" | "stopped" | "restricted" | "error";

export type LastSeenStatus =
  | "online"
  | "offline"
  | "recently"
  | "last_week"
  | "last_month"
  | "unknown";

export type EventType = "ONLINE" | "OFFLINE" | "STATUS_UNKNOWN" | "RESTRICTED";

export type SessionConfidence = "HIGH" | "MEDIUM" | "LOW";

export type CoverageStatus = "COMPLETE" | "PARTIAL" | "MISSING";

export type AlertType =
  | "LONG_SESSION"
  | "UNUSUALLY_HIGH_ACTIVITY"
  | "UNUSUALLY_LOW_ACTIVITY"
  | "TRACKING_STOPPED"
  | "TRACKING_RESUMED";

export type ReportPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export interface TelegramTarget {
  telegramUserId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  accessHash?: string;
  phone?: string;
}

export interface TelegramPresence {
  status: LastSeenStatus;
  lastSeenAt?: Date;
  expiresAt?: Date;
  isOnline: boolean;
}

export interface ActivitySummary {
  totalSeconds: number;
  formattedDuration: string;
  sessionCount: number;
  averageSessionSeconds: number;
  medianSessionSeconds: number;
  longestSessionSeconds: number;
  shortestSessionSeconds: number;
  peakHour: number;
  coverageStatus: CoverageStatus;
  confidence: SessionConfidence;
  trackingStartDate: Date;
}

export interface HourlyDistribution {
  hour: number;
  activeSeconds: number;
  sessionCount: number;
  intensity: number; // 0 to 4 for heatmaps
}

export interface DailyActivityPoint {
  date: string; // YYYY-MM-DD
  activeSeconds: number;
  sessionCount: number;
  longestSessionSeconds: number;
  coverageStatus: CoverageStatus;
}

export interface SessionItem {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  isOpen: boolean;
  confidence: SessionConfidence;
  source: string;
}

export interface TrendComparison {
  currentPeriodSeconds: number;
  previousPeriodSeconds: number;
  changePercentage: number;
  direction: "up" | "down" | "neutral";
  coverageComplete: boolean;
}

export interface AccountAnalyticsOverview {
  account: {
    id: string;
    telegramUserId: number;
    username: string | null;
    displayName: string | null;
    label: string | null;
    notes: string | null;
    trackingStatus: TrackingStatus;
    trackingStartedAt: string;
    lastSeenStatus: LastSeenStatus;
    lastSeenAt: string | null;
  };
  today: ActivitySummary;
  sevenDays: ActivitySummary;
  thirtyDays: ActivitySummary;
  weeklyTrend: TrendComparison;
  streaks: {
    currentStreakDays: number;
    longestStreakDays: number;
  };
  personalBests: {
    longestSessionSeconds: number;
    highestDailyActivitySeconds: number;
    highestDailyDate: string | null;
  };
  quietHours: {
    startHour: number;
    endHour: number;
  };
  anomalies: Array<{
    type: string;
    description: string;
    detectedAt: string;
  }>;
}
