import { describe, it, expect } from "vitest";
import { RoastEngineService } from "../../src/server/services/roast-engine.service";

describe("Deterministic Roast Rules Engine", () => {
  it("classifies TELEGRAM_INFRASTRUCTURE for 40h+ activity", () => {
    const archetype = RoastEngineService.classifyArchetype({
      targetName: "Alice",
      totalActiveSeconds: 42 * 3600,
      sessionCount: 50,
      longestSessionSeconds: 7200,
    });
    expect(archetype).toBe("TELEGRAM_INFRASTRUCTURE");

    const roast = RoastEngineService.generateRoast({
      targetName: "Alice",
      totalActiveSeconds: 42 * 3600,
      sessionCount: 50,
      longestSessionSeconds: 7200,
      roastLevel: "nuclear",
    });
    expect(roast.roastText).toContain("Pavel Durov");
    expect(roast.verdict).toContain("critical mass");
  });

  it("classifies THE_OBSERVER for high active time with low message count in a chat", () => {
    const archetype = RoastEngineService.classifyArchetype({
      targetName: "Bob",
      totalActiveSeconds: 10 * 3600,
      sessionCount: 15,
      longestSessionSeconds: 3600,
      topChatName: "Developers Group",
      topChatSeconds: 2.5 * 3600,
      topChatMessageCount: 3,
    });
    expect(archetype).toBe("THE_OBSERVER");

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
    expect(roast.roastText).toContain("conducting field research");
    expect(roast.verdict).toContain("impressive lack of typing");
  });

  it("classifies SPEED_TYPER for rapid message bursts", () => {
    const archetype = RoastEngineService.classifyArchetype({
      targetName: "Charlie",
      totalActiveSeconds: 5 * 3600,
      sessionCount: 10,
      longestSessionSeconds: 1800,
      topChatName: "Startup Group",
      topChatSeconds: 1200,
      topChatMessageCount: 95,
    });
    expect(archetype).toBe("SPEED_TYPER");

    const roast = RoastEngineService.generateRoast({
      targetName: "Charlie",
      totalActiveSeconds: 5 * 3600,
      sessionCount: 10,
      longestSessionSeconds: 1800,
      topChatName: "Startup Group",
      topChatSeconds: 1200,
      topChatMessageCount: 95,
      roastLevel: "normal",
    });
    expect(roast.roastText).toContain("unloaded a magazine");
  });

  it("classifies SERIAL_CHECKER for frequent short sessions", () => {
    const archetype = RoastEngineService.classifyArchetype({
      targetName: "Dave",
      totalActiveSeconds: 2 * 3600,
      sessionCount: 45,
      longestSessionSeconds: 300,
    });
    expect(archetype).toBe("SERIAL_CHECKER");

    const roast = RoastEngineService.generateRoast({
      targetName: "Dave",
      totalActiveSeconds: 2 * 3600,
      sessionCount: 45,
      longestSessionSeconds: 300,
      roastLevel: "normal",
    });
    expect(roast.roastText).toContain("checking the fridge");
  });
});
