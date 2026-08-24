import { DailyRepository } from "../repositories/daily.repository";
import { HourlyRepository } from "../repositories/hourly.repository";
import { SessionRepository } from "../repositories/session.repository";
import { AccountRepository } from "../repositories/account.repository";
import { formatDuration, formatPercentage, round } from "@/lib/utils";
import type {
  ActivitySummary,
  DailyActivityPoint,
  HourlyDistribution,
  TrendComparison,
  AccountAnalyticsOverview,
  CoverageStatus,
} from "@/types";

export class AnalyticsService {
  /**
   * Generates a comprehensive analytical overview for a tracked account
   */
  static async getAccountOverview(
    accountId: string,
    timezone: string = "UTC"
  ): Promise<AccountAnalyticsOverview | null> {
    const account = await AccountRepository.findById(accountId);
    if (!account) return null;

    const todayStr = this.getTodayDateString(timezone);
    const sevenDaysAgoStr = this.getPastDateString(7, timezone);
    const fourteenDaysAgoStr = this.getPastDateString(14, timezone);
    const thirtyDaysAgoStr = this.getPastDateString(30, timezone);

    // 1. Today summary
    const todayDaily = await DailyRepository.findByAccountAndDate(accountId, todayStr);
    const todaySummary = this.buildSummary(todayDaily, account.trackingStartedAt);

    // 2. 7-Day & 30-Day summaries
    const past7Days = await DailyRepository.listByRange(accountId, sevenDaysAgoStr, todayStr);
    const past14Days = await DailyRepository.listByRange(accountId, fourteenDaysAgoStr, todayStr);
    const past30Days = await DailyRepository.listByRange(accountId, thirtyDaysAgoStr, todayStr);

    const sevenDaysSummary = this.aggregateDailyList(past7Days, account.trackingStartedAt, 7);
    const thirtyDaysSummary = this.aggregateDailyList(past30Days, account.trackingStartedAt, 30);

    // 3. Weekly Trend (Current 7 days vs Previous 7 days)
    const prev7Days = past14Days.filter((d) => d.date < sevenDaysAgoStr);
    const weeklyTrend = this.calculateTrend(past7Days, prev7Days);

    // 4. Streaks
    const allDays = await DailyRepository.listRecentDays(accountId, 90);
    const streaks = this.calculateStreaks(allDays, todayStr);

    // 5. Personal Bests
    const personalBests = this.calculatePersonalBests(allDays);

    // 6. Quiet Hours & 24h Heatmap
    const hourlyData = await HourlyRepository.getHourlyDistribution(
      accountId,
      thirtyDaysAgoStr,
      todayStr
    );
    const quietHours = this.detectQuietHours(hourlyData);

    // 7. Anomalies (Z-Score on 14-day rolling window)
    const anomalies = this.detectAnomalies(past14Days, todayDaily);

    return {
      account: {
        id: account.id,
        telegramUserId: account.telegramUserId,
        username: account.username,
        displayName: account.displayName,
        label: account.label,
        notes: account.notes,
        trackingStatus: account.trackingStatus as any,
        trackingStartedAt: account.trackingStartedAt.toISOString(),
        lastSeenStatus: account.lastSeenStatus as any,
        lastSeenAt: account.lastSeenAt ? account.lastSeenAt.toISOString() : null,
      },
      today: todaySummary,
      sevenDays: sevenDaysSummary,
      thirtyDays: thirtyDaysSummary,
      weeklyTrend,
      streaks,
      personalBests,
      quietHours,
      anomalies,
    };
  }

  /**
   * Retrieves GitHub-style daily calendar data points
   */
  static async getCalendarHistory(
    accountId: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<DailyActivityPoint[]> {
    const days = await DailyRepository.listByRange(accountId, startDateStr, endDateStr);
    return days.map((d) => ({
      date: d.date,
      activeSeconds: d.activeSeconds,
      sessionCount: d.sessionCount,
      longestSessionSeconds: d.longestSessionSeconds,
      coverageStatus: d.coverageStatus as CoverageStatus,
    }));
  }

  /**
   * Retrieves 24-hour distribution heatmap (hours 0-23)
   */
  static async getHourlyHeatmap(
    accountId: string,
    daysBack: number = 30,
    timezone: string = "UTC"
  ): Promise<HourlyDistribution[]> {
    const startDate = this.getPastDateString(daysBack, timezone);
    const endDate = this.getTodayDateString(timezone);

    const rawHourly = await HourlyRepository.getHourlyDistribution(
      accountId,
      startDate,
      endDate
    );

    const hourMap = new Map<number, { seconds: number; count: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { seconds: 0, count: 0 });
    }

    let maxSecs = 0;
    for (const r of rawHourly) {
      const secs = Number(r.totalActiveSeconds) || 0;
      const cnt = Number(r.totalSessionCount) || 0;
      hourMap.set(r.hour, { seconds: secs, count: cnt });
      if (secs > maxSecs) maxSecs = secs;
    }

    const result: HourlyDistribution[] = [];
    for (let h = 0; h < 24; h++) {
      const item = hourMap.get(h)!;
      const intensity = maxSecs > 0 ? Math.min(4, Math.ceil((item.seconds / maxSecs) * 4)) : 0;
      result.push({
        hour: h,
        activeSeconds: item.seconds,
        sessionCount: item.count,
        intensity,
      });
    }

    return result;
  }

  /**
   * Compares multiple accounts side-by-side
   */
  static async compareAccounts(
    accountIds: string[],
    days: number = 7,
    timezone: string = "UTC"
  ) {
    const results = [];
    for (const id of accountIds) {
      const overview = await this.getAccountOverview(id, timezone);
      if (overview) {
        results.push(overview);
      }
    }
    return results;
  }

  // --- Helper Calculations ---

  private static buildSummary(
    daily: { activeSeconds: number; sessionCount: number; averageSessionSeconds: number; medianSessionSeconds: number; longestSessionSeconds: number; shortestSessionSeconds: number; peakHour: number; coverageStatus: string } | null,
    trackingStartDate: Date
  ): ActivitySummary {
    if (!daily) {
      return {
        totalSeconds: 0,
        formattedDuration: "0m",
        sessionCount: 0,
        averageSessionSeconds: 0,
        medianSessionSeconds: 0,
        longestSessionSeconds: 0,
        shortestSessionSeconds: 0,
        peakHour: 0,
        coverageStatus: "COMPLETE",
        confidence: "HIGH",
        trackingStartDate,
      };
    }

    return {
      totalSeconds: daily.activeSeconds,
      formattedDuration: formatDuration(daily.activeSeconds),
      sessionCount: daily.sessionCount,
      averageSessionSeconds: daily.averageSessionSeconds,
      medianSessionSeconds: daily.medianSessionSeconds,
      longestSessionSeconds: daily.longestSessionSeconds,
      shortestSessionSeconds: daily.shortestSessionSeconds,
      peakHour: daily.peakHour,
      coverageStatus: daily.coverageStatus as CoverageStatus,
      confidence: "HIGH",
      trackingStartDate,
    };
  }

  private static aggregateDailyList(
    days: Array<{ activeSeconds: number; sessionCount: number; longestSessionSeconds: number; shortestSessionSeconds: number; peakHour: number }>,
    trackingStartDate: Date,
    expectedDays: number
  ): ActivitySummary {
    let totalSeconds = 0;
    let totalSessions = 0;
    let longest = 0;
    let shortest = Number.MAX_SAFE_INTEGER;
    const hourCounts = new Map<number, number>();

    for (const d of days) {
      totalSeconds += d.activeSeconds;
      totalSessions += d.sessionCount;
      if (d.longestSessionSeconds > longest) longest = d.longestSessionSeconds;
      if (d.shortestSessionSeconds > 0 && d.shortestSessionSeconds < shortest) {
        shortest = d.shortestSessionSeconds;
      }
      hourCounts.set(d.peakHour, (hourCounts.get(d.peakHour) || 0) + 1);
    }

    if (shortest === Number.MAX_SAFE_INTEGER) shortest = 0;

    let overallPeakHour = 0;
    let maxHourCount = -1;
    for (const [hour, count] of hourCounts.entries()) {
      if (count > maxHourCount) {
        maxHourCount = count;
        overallPeakHour = hour;
      }
    }

    const avgSession = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0;
    const coverage: CoverageStatus = days.length >= expectedDays ? "COMPLETE" : days.length > 0 ? "PARTIAL" : "MISSING";

    return {
      totalSeconds,
      formattedDuration: formatDuration(totalSeconds),
      sessionCount: totalSessions,
      averageSessionSeconds: avgSession,
      medianSessionSeconds: avgSession,
      longestSessionSeconds: longest,
      shortestSessionSeconds: shortest,
      peakHour: overallPeakHour,
      coverageStatus: coverage,
      confidence: "HIGH",
      trackingStartDate,
    };
  }

  private static calculateTrend(
    currentDays: Array<{ activeSeconds: number }>,
    previousDays: Array<{ activeSeconds: number }>
  ): TrendComparison {
    const currentTotal = currentDays.reduce((acc, d) => acc + d.activeSeconds, 0);
    const prevTotal = previousDays.reduce((acc, d) => acc + d.activeSeconds, 0);

    let changePercentage = 0;
    if (prevTotal > 0) {
      changePercentage = ((currentTotal - prevTotal) / prevTotal) * 100;
    } else if (currentTotal > 0) {
      changePercentage = 100;
    }

    const direction =
      changePercentage > 2 ? "up" : changePercentage < -2 ? "down" : "neutral";

    return {
      currentPeriodSeconds: currentTotal,
      previousPeriodSeconds: prevTotal,
      changePercentage: round(changePercentage, 1),
      direction,
      coverageComplete: previousDays.length >= 7,
    };
  }

  private static calculateStreaks(
    days: Array<{ date: string; activeSeconds: number }>,
    todayStr: string
  ): { currentStreakDays: number; longestStreakDays: number } {
    if (days.length === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

    const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    let prevDate: Date | null = null;

    for (const d of sorted) {
      if (d.activeSeconds > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current active streak from today backwards
    for (const d of sorted) {
      if (d.activeSeconds > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      currentStreakDays: currentStreak,
      longestStreakDays: Math.max(longestStreak, currentStreak),
    };
  }

  private static calculatePersonalBests(
    days: Array<{ date: string; activeSeconds: number; longestSessionSeconds: number }>
  ): { longestSessionSeconds: number; highestDailyActivitySeconds: number; highestDailyDate: string | null } {
    let longestSession = 0;
    let highestDaily = 0;
    let highestDate: string | null = null;

    for (const d of days) {
      if (d.longestSessionSeconds > longestSession) {
        longestSession = d.longestSessionSeconds;
      }
      if (d.activeSeconds > highestDaily) {
        highestDaily = d.activeSeconds;
        highestDate = d.date;
      }
    }

    return {
      longestSessionSeconds: longestSession,
      highestDailyActivitySeconds: highestDaily,
      highestDailyDate: highestDate,
    };
  }

  private static detectQuietHours(
    hourly: Array<{ hour: number; totalActiveSeconds: any }>
  ): { startHour: number; endHour: number } {
    if (hourly.length < 24) {
      return { startHour: 2, endHour: 7 }; // standard default quiet window
    }

    let minSecs = Number.MAX_SAFE_INTEGER;
    let quietStart = 2;

    // Find 4-consecutive hours window with minimal observed activity
    for (let h = 0; h < 24; h++) {
      let windowSum = 0;
      for (let i = 0; i < 4; i++) {
        const targetHour = (h + i) % 24;
        const found = hourly.find((item) => item.hour === targetHour);
        windowSum += Number(found?.totalActiveSeconds || 0);
      }
      if (windowSum < minSecs) {
        minSecs = windowSum;
        quietStart = h;
      }
    }

    return {
      startHour: quietStart,
      endHour: (quietStart + 4) % 24,
    };
  }

  private static detectAnomalies(
    past14Days: Array<{ date: string; activeSeconds: number }>,
    today: { activeSeconds: number } | null
  ): Array<{ type: string; description: string; detectedAt: string }> {
    if (!today || past14Days.length < 5) return [];

    const activeSecondsList = past14Days.map((d) => d.activeSeconds);
    const mean = activeSecondsList.reduce((a, b) => a + b, 0) / activeSecondsList.length;
    const variance =
      activeSecondsList.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      activeSecondsList.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = [];

    if (stdDev > 0 && today.activeSeconds > mean + 2 * stdDev && today.activeSeconds > 3600) {
      anomalies.push({
        type: "UNUSUALLY_HIGH_ACTIVITY",
        description: `Today's observed activity (${formatDuration(today.activeSeconds)}) is significantly higher than the 14-day average (${formatDuration(Math.round(mean))}).`,
        detectedAt: new Date().toISOString(),
      });
    }

    return anomalies;
  }

  private static getTodayDateString(timezone: string = "UTC"): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  }

  private static getPastDateString(daysAgo: number, timezone: string = "UTC"): string {
    const target = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(target);
  }
}
