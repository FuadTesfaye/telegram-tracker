import { describe, it, expect } from "vitest";
import { rateLimiter } from "../../src/lib/rate-limiter";

describe("Sliding Window Rate Limiter", () => {
  it("allows requests within tier limit", () => {
    const client = "test-client-1";
    const res1 = rateLimiter.check(client, "AUTH_CODE"); // limit: 6
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(5);

    const res2 = rateLimiter.check(client, "AUTH_CODE");
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(4);
  });

  it("blocks requests once limit is exceeded and returns Retry-After", () => {
    const client = "spammer-client";
    // Exhaust 6 auth code requests
    for (let i = 0; i < 6; i++) {
      rateLimiter.check(client, "AUTH_CODE");
    }

    const blocked = rateLimiter.check(client, "AUTH_CODE");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSecs).toBeGreaterThanOrEqual(1);
  });

  it("keeps different clients and different tiers isolated", () => {
    const clientA = "client-a";
    const clientB = "client-b";

    // Exhaust client A on HISTORICAL_SCAN (limit: 8)
    for (let i = 0; i < 8; i++) {
      rateLimiter.check(clientA, "HISTORICAL_SCAN");
    }
    expect(rateLimiter.check(clientA, "HISTORICAL_SCAN").success).toBe(false);

    // Client B should still be allowed
    expect(rateLimiter.check(clientB, "HISTORICAL_SCAN").success).toBe(true);

    // Client A on a different tier (API_DEFAULT) should still be allowed
    expect(rateLimiter.check(clientA, "API_DEFAULT").success).toBe(true);
  });
});
