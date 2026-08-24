import { DailyRepository } from "../repositories/daily.repository";
import { SessionRepository } from "../repositories/session.repository";
import { AccountRepository } from "../repositories/account.repository";

export class ExportService {
  /**
   * Generates CSV string of daily activity for a tracked account
   */
  static async exportDailyCsv(accountId: string): Promise<string> {
    const account = await AccountRepository.findById(accountId);
    if (!account) throw new Error("Account not found");

    const days = await DailyRepository.listRecentDays(accountId, 365);
    const headers = [
      "date",
      "active_seconds",
      "formatted_duration",
      "session_count",
      "average_session_seconds",
      "longest_session_seconds",
      "peak_hour",
      "coverage_status",
    ];

    const rows = days.map((d) => {
      const hours = Math.floor(d.activeSeconds / 3600);
      const mins = Math.floor((d.activeSeconds % 3600) / 60);
      const durStr = `${hours}h ${mins}m`;
      return [
        d.date,
        d.activeSeconds,
        `"${durStr}"`,
        d.sessionCount,
        d.averageSessionSeconds,
        d.longestSessionSeconds,
        d.peakHour,
        d.coverageStatus,
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  /**
   * Generates full JSON bundle of account tracking history and sessions
   */
  static async exportJsonBundle(accountId: string): Promise<Record<string, unknown>> {
    const account = await AccountRepository.findById(accountId);
    if (!account) throw new Error("Account not found");

    const days = await DailyRepository.listRecentDays(accountId, 365);
    const sessions = await SessionRepository.listRecentByAccount(accountId, 500);

    return {
      exportedAt: new Date().toISOString(),
      disclaimer:
        "Activity data is based on observable Telegram presence and is not exact device screen time.",
      account: {
        id: account.id,
        telegramUserId: account.telegramUserId,
        username: account.username,
        displayName: account.displayName,
        trackingStartedAt: account.trackingStartedAt,
      },
      dailyHistory: days,
      recentSessions: sessions.map((s) => ({
        id: s.id,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationSeconds: s.durationSeconds,
        confidence: s.confidence,
        source: s.source,
      })),
    };
  }
}
