import { describe, it, expect } from "vitest";
import { formatDuration, formatPercentage, normalizeUsername } from "../../src/lib/utils";

describe("Utility Functions", () => {
  it("formats duration in seconds to human-readable strings", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(180)).toBe("3m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(7320)).toBe("2h 2m");
  });

  it("normalizes Telegram usernames correctly", () => {
    expect(normalizeUsername("@alice")).toBe("alice");
    expect(normalizeUsername("https://t.me/bob")).toBe("bob");
    expect(normalizeUsername("t.me/Charlie")).toBe("charlie");
    expect(normalizeUsername("  David  ")).toBe("david");
  });

  it("formats percentages with appropriate signs", () => {
    expect(formatPercentage(18.4)).toBe("+18.4%");
    expect(formatPercentage(-12.5)).toBe("-12.5%");
    expect(formatPercentage(0)).toBe("0.0%");
  });
});
