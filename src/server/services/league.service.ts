import { AccountRepository } from "../repositories/account.repository";
import { DailyRepository } from "../repositories/daily.repository";
import { SessionRepository } from "../repositories/session.repository";
import { UserRepository } from "../repositories/user.repository";
import { RoastEngineService, type RoastLevel } from "./roast-engine.service";
import { FootprintService } from "./footprint.service";
import { db } from "@/db";
import { userRivals, userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDuration } from "@/lib/utils";

export interface LeagueCompetitor {
  accountId: string;
  telegramUserId: number;
  username: string | null;
  displayName: string;
  label: string | null;
  rank: number;
  totalActiveSeconds: number;
  formattedDuration: string;
  sessionCount: number;
  longestSessionSeconds: number;
  formattedLongestSession: string;
  nightActivitySeconds: number;
  morningActivitySeconds: number;
  title: string;
  tier: {
    name: "Bronze" | "Silver" | "Gold" | "Diamond" | "Telegram Royalty";
    icon: string;
    threshold: string;
  };
  gapToLeaderSeconds: number;
  formattedGapToLeader: string;
}

export interface LeagueAward {
  id: string;
  title: string;
  icon: string;
  recipientName: string;
  recipientUsername: string | null;
  statDescription: string;
  badge: string;
}

export interface RivalComparison {
  userAccount: LeagueCompetitor | null;
  rivalAccount: LeagueCompetitor | null;
  gapSeconds: number;
  formattedGap: string;
  isUserLeading: boolean;
  statusMessage: string;
}

export class LeagueService {
  /**
   * Generates a ridiculous, statistics-backed title based on actual presence metrics
   */
  static generateTitle(stats: {
    totalActiveSeconds: number;
    longestSessionSeconds: number;
    sessionCount: number;
    nightActivitySeconds: number;
    morningActivitySeconds: number;
    weeklyChangePercentage?: number;
  }): string {
    const hours = stats.totalActiveSeconds / 3600;

    // 1. Extreme duration titles
    if (hours >= 45) return "🛰️ Telegram Infrastructure";
    if (hours >= 40) return "👑 Telegram Emperor";
    if (hours >= 35) return "🧠 Supreme Online Commander";
    if (hours >= 30) return "📱 Full-Time Telegram Employee";
    if (hours >= 25) return "🫡 Minister of Being Online";
    if (hours >= 20) return "📡 24/7 Signal Tower";
    if (hours >= 15) return "🔌 Human Push Notification";

    // 2. Behavioral titles
    if (stats.longestSessionSeconds >= 4 * 3600) return "🪑 The Chair Resident";
    if (stats.sessionCount >= 80) return "🚪 Door → Telegram → Door → Telegram";
    if (stats.nightActivitySeconds >= 8 * 3600) return "🌙 Lord of the Night Shift";
    if (stats.morningActivitySeconds >= 5 * 3600) return "☀️ The 5AM Telegram Prophet";

    if (stats.weeklyChangePercentage && stats.weeklyChangePercentage >= 50) {
      return "📈 The Comeback Addict";
    }
    if (stats.weeklyChangePercentage && stats.weeklyChangePercentage <= -40) {
      return "🧘 Enlightened One — Finally Left Telegram";
    }

    if (hours >= 10) return "🏃 Professional Scroller";
    if (hours >= 5) return "🏠 Telegram Homeowner";
    if (hours >= 2) return "😐 Aggressively Normal";

    return "🫥 The Ghost Lurker";
  }

  /**
   * Determine league tier based on weekly activity
   */
  static getTier(activeSeconds: number): {
    name: "Bronze" | "Silver" | "Gold" | "Diamond" | "Telegram Royalty";
    icon: string;
    threshold: string;
  } {
    const hours = activeSeconds / 3600;
    if (hours >= 40) return { name: "Telegram Royalty", icon: "👑", threshold: "40h+" };
    if (hours >= 30) return { name: "Diamond", icon: "💎", threshold: "30-40h" };
    if (hours >= 20) return { name: "Gold", icon: "🥇", threshold: "20-30h" };
    if (hours >= 10) return { name: "Silver", icon: "🥈", threshold: "10-20h" };
    return { name: "Bronze", icon: "🥉", threshold: "< 10h" };
  }

  /**
   * Generates a multi-level roast using RoastEngineService
   */
  static generateRoast(
    competitor: LeagueCompetitor,
    rank: number,
    totalCompetitors: number,
    level: RoastLevel = "normal"
  ) {
    return RoastEngineService.generateRoast({
      targetName: competitor.displayName,
      totalActiveSeconds: competitor.totalActiveSeconds,
      sessionCount: competitor.sessionCount,
      longestSessionSeconds: competitor.longestSessionSeconds,
      nightActivitySeconds: competitor.nightActivitySeconds,
      morningActivitySeconds: competitor.morningActivitySeconds,
      roastLevel: level,
    });
  }

  /**
   * Computes the current weekly leaderboard for a user's tracked accounts (up to 3 slots)
   */
  static async getWeeklyLeaderboard(
    userId: string,
    timezone: string = "UTC"
  ): Promise<{
    weekNumber: number;
    year: number;
    competitors: LeagueCompetitor[];
    awards: LeagueAward[];
    weeklyVictim: LeagueCompetitor | null;
  }> {
    const accounts = await AccountRepository.listByOwner(userId);
    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    const sevenDaysAgoStr = this.getPastDateString(7, timezone);
    const todayStr = this.getTodayDateString(timezone);

    const competitorList: LeagueCompetitor[] = [];

    for (const acc of accounts) {
      const dailyRows = await DailyRepository.listByRange(
        acc.id,
        sevenDaysAgoStr,
        todayStr
      );

      let totalSeconds = 0;
      let totalSessions = 0;
      let longestSession = 0;

      for (const d of dailyRows) {
        totalSeconds += d.activeSeconds;
        totalSessions += d.sessionCount;
        if (d.longestSessionSeconds > longestSession) {
          longestSession = d.longestSessionSeconds;
        }
      }

      const sessions = await SessionRepository.listByDateRange(
        acc.id,
        new Date(Date.now() - 7 * 24 * 3600 * 1000),
        new Date()
      );

      let nightSecs = 0;
      let morningSecs = 0;
      for (const s of sessions) {
        const hr = s.startedAt.getUTCHours();
        const dur = s.durationSeconds || 0;
        if (hr >= 22 || hr < 6) nightSecs += dur;
        if (hr >= 6 && hr < 9) morningSecs += dur;
      }

      const title = this.generateTitle({
        totalActiveSeconds: totalSeconds,
        longestSessionSeconds: longestSession,
        sessionCount: totalSessions,
        nightActivitySeconds: nightSecs,
        morningActivitySeconds: morningSecs,
      });

      const tier = this.getTier(totalSeconds);

      competitorList.push({
        accountId: acc.id,
        telegramUserId: acc.telegramUserId,
        username: acc.username,
        displayName: acc.displayName || (acc.username ? `@${acc.username}` : "Account"),
        label: acc.label,
        rank: 1,
        totalActiveSeconds: totalSeconds,
        formattedDuration: formatDuration(totalSeconds),
        sessionCount: totalSessions,
        longestSessionSeconds: longestSession,
        formattedLongestSession: formatDuration(longestSession),
        nightActivitySeconds: nightSecs,
        morningActivitySeconds: morningSecs,
        title,
        tier,
        gapToLeaderSeconds: 0,
        formattedGapToLeader: "0m",
      });
    }

    // Sort by active seconds descending
    competitorList.sort((a, b) => b.totalActiveSeconds - a.totalActiveSeconds);

    const leaderSeconds = competitorList[0]?.totalActiveSeconds || 0;

    competitorList.forEach((c, idx) => {
      c.rank = idx + 1;
      c.gapToLeaderSeconds = Math.max(0, leaderSeconds - c.totalActiveSeconds);
      c.formattedGapToLeader = formatDuration(c.gapToLeaderSeconds);
    });

    const awards = this.calculateAwards(competitorList);
    const weeklyVictim = competitorList.length > 0 ? competitorList[0] : null;

    return {
      weekNumber,
      year,
      competitors: competitorList,
      awards,
      weeklyVictim,
    };
  }

  /**
   * Computes mini-awards for the week
   */
  static calculateAwards(competitors: LeagueCompetitor[]): LeagueAward[] {
    if (competitors.length === 0) return [];
    const awards: LeagueAward[] = [];

    // 1. Weekly Champion
    const champion = competitors[0];
    if (champion && champion.totalActiveSeconds > 0) {
      awards.push({
        id: "champion",
        title: "Weekly Champion",
        icon: "🏆",
        recipientName: champion.displayName,
        recipientUsername: champion.username,
        statDescription: `${champion.formattedDuration} total observed`,
        badge: champion.title,
      });
    }

    // 2. Session King
    const sessionKing = [...competitors].sort(
      (a, b) => b.longestSessionSeconds - a.longestSessionSeconds
    )[0];
    if (sessionKing && sessionKing.longestSessionSeconds > 0) {
      awards.push({
        id: "session_king",
        title: "Session King",
        icon: "⏱",
        recipientName: sessionKing.displayName,
        recipientUsername: sessionKing.username,
        statDescription: `${sessionKing.formattedLongestSession} continuous session`,
        badge: "🪑 The Chair Resident",
      });
    }

    // 3. Serial Checker
    const serialChecker = [...competitors].sort(
      (a, b) => b.sessionCount - a.sessionCount
    )[0];
    if (serialChecker && serialChecker.sessionCount > 0) {
      awards.push({
        id: "serial_checker",
        title: "Serial Checker",
        icon: "🔁",
        recipientName: serialChecker.displayName,
        recipientUsername: serialChecker.username,
        statDescription: `${serialChecker.sessionCount} separate sessions`,
        badge: "🚪 Door → Telegram",
      });
    }

    // 4. Night Owl
    const nightOwl = [...competitors].sort(
      (a, b) => b.nightActivitySeconds - a.nightActivitySeconds
    )[0];
    if (nightOwl && nightOwl.nightActivitySeconds > 3600) {
      awards.push({
        id: "night_owl",
        title: "Night Owl",
        icon: "🌙",
        recipientName: nightOwl.displayName,
        recipientUsername: nightOwl.username,
        statDescription: `${formatDuration(nightOwl.nightActivitySeconds)} after 22:00`,
        badge: "Lord of the Night Shift",
      });
    }

    // 5. Ghost Award
    const ghost = competitors[competitors.length - 1];
    if (ghost && competitors.length > 1) {
      awards.push({
        id: "ghost_award",
        title: "Ghost Award",
        icon: "🫥",
        recipientName: ghost.displayName,
        recipientUsername: ghost.username,
        statDescription: `Only ${ghost.formattedDuration} observed`,
        badge: "🌱 Touched Grass",
      });
    }

    return awards;
  }

  /**
   * Head-to-Head Rival tracker
   */
  static async getRivalStatus(
    userId: string,
    rivalAccountId?: string
  ): Promise<RivalComparison | null> {
    const leaderboard = await this.getWeeklyLeaderboard(userId);
    if (leaderboard.competitors.length < 2) return null;

    const userAccount = leaderboard.competitors[0];
    let targetRivalId = rivalAccountId;

    if (!targetRivalId) {
      const savedRival = await db
        .select()
        .from(userRivals)
        .where(eq(userRivals.userId, userId))
        .limit(1);
      if (savedRival.length > 0) {
        targetRivalId = savedRival[0].rivalAccountId;
      }
    }

    const rivalAccount = targetRivalId
      ? leaderboard.competitors.find((c) => c.accountId === targetRivalId) || leaderboard.competitors[1]
      : leaderboard.competitors[1];

    if (!userAccount || !rivalAccount) return null;

    const diffSeconds = userAccount.totalActiveSeconds - rivalAccount.totalActiveSeconds;
    const isUserLeading = diffSeconds >= 0;
    const gapSeconds = Math.abs(diffSeconds);
    const formattedGap = formatDuration(gapSeconds);

    const statusMessage = isUserLeading
      ? `👑 You are leading @${rivalAccount.username || rivalAccount.displayName} by ${formattedGap}. Defend the throne!`
      : `😈 You are losing to @${rivalAccount.username || rivalAccount.displayName} by ${formattedGap}. The crown is slipping!`;

    return {
      userAccount,
      rivalAccount,
      gapSeconds,
      formattedGap,
      isUserLeading,
      statusMessage,
    };
  }

  /**
   * Designate a specific rival account
   */
  static async setRival(userId: string, rivalAccountId: string) {
    const [rival] = await db
      .insert(userRivals)
      .values({
        userId,
        rivalAccountId,
      })
      .onConflictDoUpdate({
        target: userRivals.userId,
        set: {
          rivalAccountId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return rival;
  }

  /**
   * Midweek Prediction
   */
  static async getMidweekPrediction(userId: string): Promise<{
    leader: LeagueCompetitor | null;
    runnerUp: LeagueCompetitor | null;
    projectedLeaderTotal: string;
    projectedRunnerUpTotal: string;
    predictionMessage: string;
  } | null> {
    const leaderboard = await this.getWeeklyLeaderboard(userId);
    if (leaderboard.competitors.length === 0) return null;

    const leader = leaderboard.competitors[0];
    const runnerUp = leaderboard.competitors[1] || null;

    const dayOfWeek = new Date().getDay() || 7;
    const multiplier = 7 / Math.max(1, dayOfWeek);

    const projectedLeaderSecs = Math.round(leader.totalActiveSeconds * multiplier);
    const projectedRunnerSecs = runnerUp ? Math.round(runnerUp.totalActiveSeconds * multiplier) : 0;

    return {
      leader,
      runnerUp,
      projectedLeaderTotal: formatDuration(projectedLeaderSecs),
      projectedRunnerUpTotal: formatDuration(projectedRunnerSecs),
      predictionMessage: `🔮 Projected Weekly Champion: @${leader.username || leader.displayName} (~${formatDuration(projectedLeaderSecs)})`,
    };
  }

  private static getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private static getTodayDateString(timezone: string): string {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  private static getPastDateString(daysAgo: number, timezone: string): string {
    const target = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(target);
  }
}
