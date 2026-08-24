import { describe, it, expect } from "vitest";
import { LeagueService } from "../../src/server/services/league.service";

describe("Telegram League & Roast Engine", () => {
  it("assigns appropriate ridiculous titles based on presence hours", () => {
    expect(
      LeagueService.generateTitle({
        totalActiveSeconds: 46 * 3600,
        longestSessionSeconds: 3600,
        sessionCount: 20,
        nightActivitySeconds: 0,
        morningActivitySeconds: 0,
      })
    ).toBe("🛰️ Telegram Infrastructure");

    expect(
      LeagueService.generateTitle({
        totalActiveSeconds: 41 * 3600,
        longestSessionSeconds: 3600,
        sessionCount: 20,
        nightActivitySeconds: 0,
        morningActivitySeconds: 0,
      })
    ).toBe("👑 Telegram Emperor");

    expect(
      LeagueService.generateTitle({
        totalActiveSeconds: 32 * 3600,
        longestSessionSeconds: 3600,
        sessionCount: 20,
        nightActivitySeconds: 0,
        morningActivitySeconds: 0,
      })
    ).toBe("📱 Full-Time Telegram Employee");

    expect(
      LeagueService.generateTitle({
        totalActiveSeconds: 4 * 3600,
        longestSessionSeconds: 1800,
        sessionCount: 5,
        nightActivitySeconds: 0,
        morningActivitySeconds: 0,
      })
    ).toBe("😐 Aggressively Normal");
  });

  it("calculates promotion league tiers accurately", () => {
    expect(LeagueService.getTier(45 * 3600).name).toBe("Telegram Royalty");
    expect(LeagueService.getTier(35 * 3600).name).toBe("Diamond");
    expect(LeagueService.getTier(25 * 3600).name).toBe("Gold");
    expect(LeagueService.getTier(15 * 3600).name).toBe("Silver");
    expect(LeagueService.getTier(5 * 3600).name).toBe("Bronze");
  });

  it("generates deterministic, statistics-backed roasts", () => {
    const mockCompetitor = {
      accountId: "acc1",
      telegramUserId: 12345,
      username: "fuadtesfaye",
      displayName: "Fuad Tesfaye",
      label: "Myself",
      rank: 1,
      totalActiveSeconds: 42 * 3600,
      formattedDuration: "42h",
      sessionCount: 55,
      longestSessionSeconds: 7200,
      formattedLongestSession: "2h",
      nightActivitySeconds: 5000,
      morningActivitySeconds: 2000,
      title: "👑 Telegram Emperor",
      tier: { name: "Telegram Royalty" as const, icon: "👑", threshold: "40h+" },
      gapToLeaderSeconds: 0,
      formattedGapToLeader: "0m",
    };

    const roast = LeagueService.generateRoast(mockCompetitor, 1, 3, "normal");
    expect(roast.roastText).toContain("42h logged this week");
    expect(roast.roastText).toContain("employee who forgot to clock out");
    expect(roast.verdict).toContain("more time on Telegram this week than most people spend at full-time jobs");
  });
});
