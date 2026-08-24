import { describe, it, expect } from "vitest";
import { splitSessionByMidnight } from "../../src/tracker/engine/midnight-splitter";

describe("Midnight Session Splitter", () => {
  it("keeps a same-day session as a single daily slice", () => {
    const start = new Date("2026-08-24T10:00:00.000Z");
    const end = new Date("2026-08-24T10:45:00.000Z");

    const slices = splitSessionByMidnight(start, end);
    expect(slices).toHaveLength(1);
    expect(slices[0].dateStr).toBe("2026-08-24");
    expect(slices[0].durationSeconds).toBe(2700); // 45 minutes = 2700s
  });

  it("accurately splits a session spanning across midnight into two slices", () => {
    // 23:50 UTC to 00:20 UTC next day
    const start = new Date("2026-08-24T23:50:00.000Z");
    const end = new Date("2026-08-25T00:20:00.000Z");

    const slices = splitSessionByMidnight(start, end);
    expect(slices).toHaveLength(2);

    // Day 1: 23:50 to 23:59:59.999 (600s = 10m)
    expect(slices[0].dateStr).toBe("2026-08-24");
    expect(slices[0].durationSeconds).toBe(600);

    // Day 2: 00:00 to 00:20 (1200s = 20m)
    expect(slices[1].dateStr).toBe("2026-08-25");
    expect(slices[1].durationSeconds).toBe(1200);

    // Total duration should equal original 30 mins (1800s)
    expect(slices[0].durationSeconds + slices[1].durationSeconds).toBe(1800);
  });
});
