import { DailyRepository } from "@/server/repositories/daily.repository";
import { HourlyRepository } from "@/server/repositories/hourly.repository";
import { SessionRepository } from "@/server/repositories/session.repository";
import { splitSessionByMidnight } from "./midnight-splitter";
import { logger } from "@/lib/logger";

export class Aggregator {
  /**
   * Incrementally aggregate a completed session into daily and hourly rollups
   */
  static async processSession(
    trackedAccountId: string,
    startedAt: Date,
    endedAt: Date
  ) {
    const slices = splitSessionByMidnight(startedAt, endedAt);

    for (const slice of slices) {
      try {
        // 1. Update Hourly distribution
        for (const hr of slice.hourDistribution) {
          const existingHour = await HourlyRepository.upsert({
            trackedAccountId,
            date: slice.dateStr,
            hour: hr.hour,
            activeSeconds: hr.seconds,
            sessionCount: 1,
          });
        }

        // 2. Recompute and update Daily activity metrics
        await this.recalculateDay(trackedAccountId, slice.dateStr);
      } catch (err) {
        logger.error("Failed to process session aggregation slice", {
          trackedAccountId,
          sliceDate: slice.dateStr,
          error: err,
        });
      }
    }
  }

  /**
   * Recalculates full daily stats for a specific day from all sessions on that day
   */
  static async recalculateDay(trackedAccountId: string, dateStr: string) {
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const sessions = await SessionRepository.listByDateRange(
      trackedAccountId,
      dayStart,
      dayEnd
    );

    if (sessions.length === 0) {
      return;
    }

    let totalActiveSeconds = 0;
    const durations: number[] = [];
    let firstSeen: Date | null = null;
    let lastSeen: Date | null = null;

    for (const s of sessions) {
      if (!firstSeen || s.startedAt < firstSeen) firstSeen = s.startedAt;
      const effectiveEnd = s.endedAt || s.startedAt;
      if (!lastSeen || effectiveEnd > lastSeen) lastSeen = effectiveEnd;

      const dur = s.durationSeconds || Math.max(1, Math.round((effectiveEnd.getTime() - s.startedAt.getTime()) / 1000));
      totalActiveSeconds += dur;
      durations.push(dur);
    }

    durations.sort((a, b) => a - b);
    const sessionCount = durations.length;
    const longest = durations[durations.length - 1] || 0;
    const shortest = durations[0] || 0;
    const average = sessionCount > 0 ? Math.round(totalActiveSeconds / sessionCount) : 0;
    const midIndex = Math.floor(sessionCount / 2);
    const median = sessionCount % 2 === 0
      ? Math.round((durations[midIndex - 1] + durations[midIndex]) / 2)
      : durations[midIndex];

    // Find peak hour from hourly table
    const hourlyData = await HourlyRepository.getHourlyDistribution(
      trackedAccountId,
      dateStr,
      dateStr
    );
    let peakHour = 0;
    let maxHourSecs = -1;
    for (const hr of hourlyData) {
      if (Number(hr.totalActiveSeconds) > maxHourSecs) {
        maxHourSecs = Number(hr.totalActiveSeconds);
        peakHour = hr.hour;
      }
    }

    await DailyRepository.upsert({
      trackedAccountId,
      date: dateStr,
      activeSeconds: totalActiveSeconds,
      sessionCount,
      averageSessionSeconds: average,
      medianSessionSeconds: median,
      longestSessionSeconds: longest,
      shortestSessionSeconds: shortest,
      firstSeenAt: firstSeen,
      lastSeenAt: lastSeen,
      peakHour,
      coverageStatus: "COMPLETE",
    });
  }
}
