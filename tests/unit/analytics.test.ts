import { describe, it, expect } from "vitest";
import { AnalyticsService } from "../../src/server/services/analytics.service";

describe("Analytics Service Logic", () => {
  it("calculates trend changes correctly between two consecutive periods", () => {
    // Current period = 1000s, previous period = 800s -> +25%
    const current = [{ activeSeconds: 600 }, { activeSeconds: 400 }];
    const previous = [{ activeSeconds: 400 }, { activeSeconds: 400 }];

    // @ts-ignore - access private static helper for test
    const trend = AnalyticsService["calculateTrend"](current, previous);
    expect(trend.changePercentage).toBe(25.0);
    expect(trend.direction).toBe("up");
  });

  it("identifies quiet hours window based on minimum activity", () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      totalActiveSeconds: i >= 2 && i <= 5 ? 10 : 3600, // hours 2-5 have minimal activity
      totalSessionCount: 1,
    }));

    // @ts-ignore
    const quiet = AnalyticsService["detectQuietHours"](hourlyData);
    expect(quiet.startHour).toBe(2);
    expect(quiet.endHour).toBe(6);
  });

  it("calculates continuous streaks correctly", () => {
    const days = [
      { date: "2026-08-24", activeSeconds: 3600 },
      { date: "2026-08-23", activeSeconds: 1800 },
      { date: "2026-08-22", activeSeconds: 7200 },
      { date: "2026-08-21", activeSeconds: 0 }, // gap
      { date: "2026-08-20", activeSeconds: 5000 },
    ];

    // @ts-ignore
    const streaks = AnalyticsService["calculateStreaks"](days, "2026-08-24");
    expect(streaks.currentStreakDays).toBe(3);
    expect(streaks.longestStreakDays).toBe(3);
  });
});
