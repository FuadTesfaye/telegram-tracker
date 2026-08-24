import { describe, it, expect } from "vitest";
import { RoastEngineService } from "../../src/server/services/roast-engine.service";

describe("Data-Driven Roast Rules Engine & Master Catalog", () => {
  it("generates Weekly Winner roast for #1 rank", () => {
    const roast = RoastEngineService.generateRoast({
      targetName: "Alice",
      rank: 1,
      totalCompetitors: 3,
      totalActiveSeconds: 42 * 3600,
      sessionCount: 50,
      longestSessionSeconds: 7200,
      roastLevel: "normal",
    });

    expect(roast.category).toBe("WEEKLY_WINNER");
    expect(roast.title).toBeDefined();
    expect(roast.roastText).toBeDefined();
    expect(roast.verdict).toBeDefined();
  });

  it("generates The Observer roast for low message, high time", () => {
    const roast = RoastEngineService.generateRoast({
      targetName: "Bob",
      totalActiveSeconds: 10 * 3600,
      sessionCount: 15,
      longestSessionSeconds: 3600,
      topChatName: "Developers Group",
      topChatSeconds: 2.5 * 3600,
      topChatMessageCount: 3,
      roastLevel: "normal",
    });

    expect(roast.category).toBe("LOW_MESSAGES_HIGH_TIME");
    expect(roast.roastText.length).toBeGreaterThan(10);
  });

  it("generates Girl Group / Diplomatic roast when custom labeled", () => {
    const roast = RoastEngineService.generateRoast({
      targetName: "David",
      totalActiveSeconds: 6 * 3600,
      sessionCount: 12,
      longestSessionSeconds: 1800,
      topChatName: "Girls Group",
      customChatLabel: "Girls Group",
      topChatSeconds: 2.5 * 3600,
      topChatMessageCount: 4,
      roastLevel: "normal",
    });

    expect(roast.category).toBe("GIRL_GROUP");
    expect(roast.title).toBeDefined();
  });

  it("generates Favorite Human roast when top private chat dominates", () => {
    const roast = RoastEngineService.generateRoast({
      targetName: "Eve",
      totalActiveSeconds: 8 * 3600,
      sessionCount: 20,
      longestSessionSeconds: 3600,
      topChatType: "private",
      topChatName: "Best Friend",
      topChatPercent: 45,
      topChatSeconds: 3.6 * 3600,
      roastLevel: "normal",
    });

    expect(roast.category).toBe("TOP_PRIVATE_CHAT");
    expect(roast.roastText).toBeDefined();
  });

  it("generates legendary Roast of the Week", () => {
    const rotw = RoastEngineService.generateRoastOfTheWeek("Alice", 42 * 3600, 85);
    expect(rotw).toContain("ROAST OF THE WEEK");
    expect(rotw).toContain("Alice");
  });

  it("generates Three-Account Triumvirate title", () => {
    const title = RoastEngineService.getThreeAccountTriumvirateTitle();
    expect(typeof title).toBe("string");
    expect(title.length).toBeGreaterThan(3);
  });
});
