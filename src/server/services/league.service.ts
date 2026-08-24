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
    rank?: number;
    totalCompetitors?: number;
  }): string {
    const roast = RoastEngineService.generateRoast({
      targetName: "Competitor",
      totalActiveSeconds: stats.totalActiveSeconds,
      longestSessionSeconds: stats.longestSessionSeconds,
      sessionCount: stats.sessionCount,
      nightActivitySeconds: stats.nightActivitySeconds,
      morningActivitySeconds: stats.morningActivitySeconds,
      weeklyChangePercent: stats.weeklyChangePercentage,
      rank: stats.rank,
      totalCompetitors: stats.totalCompetitors,
    });

    return roast.title;
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
      rank,
      totalCompetitors,
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
    triumvirateTitle: string;
    roastOfTheWeek: string;
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
        title: "", // Assigned after sorting
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

      c.title = this.generateTitle({
        totalActiveSeconds: c.totalActiveSeconds,
        longestSessionSeconds: c.longestSessionSeconds,
        sessionCount: c.sessionCount,
        nightActivitySeconds: c.nightActivitySeconds,
        morningActivitySeconds: c.morningActivitySeconds,
        rank: c.rank,
        totalCompetitors: competitorList.length,
      });
    });

    const awards = this.calculateAwards(competitorList);
    const weeklyVictim = competitorList.length > 0 ? competitorList[0] : null;
    const triumvirateTitle = RoastEngineService.getThreeAccountTriumvirateTitle();

    let roastOfTheWeek = "";
    if (weeklyVictim) {
      roastOfTheWeek = RoastEngineService.generateRoastOfTheWeek(
        weeklyVictim.displayName,
        weeklyVictim.totalActiveSeconds,
        weeklyVictim.sessionCount
      );
    }

    return {
      weekNumber,
      year,
      triumvirateTitle,
      roastOfTheWeek,
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

    // 1. Session King (Longest Continuous Sitting)
    const longestSessionComp = [...competitors].sort(
      (a, b) => b.longestSessionSeconds - a.longestSessionSeconds
    )[0];
    if (longestSessionComp && longestSessionComp.longestSessionSeconds > 1800) {
      awards.push({
        id: "award_session_king",
        title: "Chair Resident",
        icon: "🪑",
        recipientName: longestSessionComp.displayName,
        recipientUsername: longestSessionComp.username,
        statDescription: `${longestSessionComp.formattedLongestSession} continuous session`,
        badge: "🪑 Longest Sitting",
      });
    }

    // 2. Serial Checker (Most Sessions)
    const mostSessionsComp = [...competitors].sort(
      (a, b) => b.sessionCount - a.sessionCount
    )[0];
    if (mostSessionsComp && mostSessionsComp.sessionCount >= 10) {
      awards.push({
        id: "award_serial_checker",
        title: "Serial Checker",
        icon: "🔄",
        recipientName: mostSessionsComp.displayName,
        recipientUsername: mostSessionsComp.username,
        statDescription: `${mostSessionsComp.sessionCount} app openings this week`,
        badge: "🚪 Door Knocker",
      });
    }

    // 3. Night Owl (22:00 - 05:00)
    const nightComp = [...competitors].sort(
      (a, b) => b.nightActivitySeconds - a.nightActivitySeconds
    )[0];
    if (nightComp && nightComp.nightActivitySeconds > 1800) {
      awards.push({
        id: "award_night_owl",
        title: "Lord of the Last Seen",
        icon: "🌙",
        recipientName: nightComp.displayName,
        recipientUsername: nightComp.username,
        statDescription: `${formatDuration(nightComp.nightActivitySeconds)} logged after dark`,
        badge: "🦉 Night Shift",
      });
    }

    // 4. Early Bird (05:00 - 09:00)
    const earlyComp = [...competitors].sort(
      (a, b) => b.morningActivitySeconds - a.morningActivitySeconds
    )[0];
    if (earlyComp && earlyComp.morningActivitySeconds > 1800) {
      awards.push({
        id: "award_early_bird",
        title: "5AM Prophet",
        icon: "🌅",
        recipientName: earlyComp.displayName,
        recipientUsername: earlyComp.username,
        statDescription: `${formatDuration(earlyComp.morningActivitySeconds)} active before 9AM`,
        badge: "☀️ Dawn Patrol",
      });
    }

    // 5. Grass Toucher (The Ghost)
    const ghostComp = [...competitors].sort(
      (a, b) => a.totalActiveSeconds - b.totalActiveSeconds
    )[0];
    if (ghostComp && ghostComp.totalActiveSeconds < 7200) {
      awards.push({
        id: "award_ghost",
        title: "Telegram Ghost",
        icon: "🌱",
        recipientName: ghostComp.displayName,
        recipientUsername: ghostComp.username,
        statDescription: `Only ${ghostComp.formattedDuration} this week (Healthy human)`,
        badge: "🌿 Touched Grass",
      });
    }

    return awards;
  }

  /**
   * Head-to-Head Rival Status Tracker
   */
  static async getRivalStatus(userId: string, overrideRivalAccountId?: string): Promise<RivalComparison | null> {
    const leaderboard = await this.getWeeklyLeaderboard(userId);
    if (leaderboard.competitors.length < 2) return null;

    const [rivalRow] = await db
      .select()
      .from(userRivals)
      .where(eq(userRivals.userId, userId))
      .limit(1);

    let userAcc = leaderboard.competitors.find((c) => c.label === "Myself") || leaderboard.competitors[0];
    let rivalAcc: LeagueCompetitor | undefined;

    const targetRivalId = overrideRivalAccountId || rivalRow?.rivalAccountId;
    if (targetRivalId) {
      rivalAcc = leaderboard.competitors.find((c) => c.accountId === targetRivalId);
    }

    if (!rivalAcc) {
      rivalAcc = leaderboard.competitors.find((c) => c.accountId !== userAcc.accountId) || leaderboard.competitors[1];
    }

    if (!rivalAcc) return null;

    const gap = userAcc.totalActiveSeconds - rivalAcc.totalActiveSeconds;
    const isUserLeading = gap >= 0;
    const formattedGap = formatDuration(Math.abs(gap));

    let statusMessage = "";
    if (isUserLeading) {
      statusMessage = `👑 You are leading @${rivalAcc.username || rivalAcc.displayName} by ${formattedGap}. Defend the throne!`;
    } else {
      statusMessage = `💀 @${rivalAcc.username || rivalAcc.displayName} is ahead by ${formattedGap}. Start scrolling to close the gap!`;
    }

    return {
      userAccount: userAcc,
      rivalAccount: rivalAcc,
      gapSeconds: Math.abs(gap),
      formattedGap,
      isUserLeading,
      statusMessage,
    };
  }

  /**
   * Set designated rival account
   */
  static async setRival(userId: string, rivalAccountId: string) {
    const [existing] = await db
      .select()
      .from(userRivals)
      .where(eq(userRivals.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userRivals)
        .set({ rivalAccountId, updatedAt: new Date() })
        .where(eq(userRivals.userId, userId));
    } else {
      await db.insert(userRivals).values({
        userId,
        rivalAccountId,
      });
    }
  }

  /**
   * Midweek pace projection
   */
  static async getMidweekPrediction(userId: string): Promise<string> {
    const leaderboard = await this.getWeeklyLeaderboard(userId);
    if (leaderboard.competitors.length === 0) return "No active competitors.";

    const leader = leaderboard.competitors[0];
    const hours = leader.totalActiveSeconds / 3600;
    const projectedHours = Math.round((hours / Math.max(1, new Date().getDay() || 7)) * 7);

    return `🔮 Pace Projection: ${leader.displayName} is tracking for ~${projectedHours}h by Sunday.`;
  }

  private static getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private static getTodayDateString(timezone: string = "UTC"): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  }

  private static getPastDateString(daysAgo: number, timezone: string = "UTC"): string {
    const d = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(d);
  }
}
