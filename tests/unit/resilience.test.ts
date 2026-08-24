import { describe, it, expect, vi } from "vitest";
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  retryWithBackoff,
  withTimeout,
  TimeoutError,
} from "../../src/lib/resilience";

describe("Resilience: withTimeout", () => {
  it("resolves successfully if operation completes within timeout", async () => {
    const res = await withTimeout(Promise.resolve("hello"), 500);
    expect(res).toBe("hello");
  });

  it("throws TimeoutError if operation exceeds timeout", async () => {
    const hanging = new Promise((resolve) => setTimeout(resolve, 1000));
    await expect(withTimeout(hanging, 50, "Operation timed out")).rejects.toThrow(
      TimeoutError
    );
  });
});

describe("Resilience: retryWithBackoff", () => {
  it("succeeds on first attempt without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const res = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(res).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries upon failure and succeeds on subsequent attempt", async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) throw new Error("Transient error");
      return "recovered";
    });

    const res = await retryWithBackoff(fn, {
      maxRetries: 4,
      initialDelayMs: 10,
      maxDelayMs: 50,
    });

    expect(res).toBe("recovered");
    expect(attempts).toBe(3);
  });

  it("throws after exhausting max retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Persistent failure"));
    await expect(
      retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 5,
        maxDelayMs: 20,
      })
    ).rejects.toThrow("Persistent failure");

    expect(fn).toHaveBeenCalledTimes(3); // attempt 1 + 2 retries
  });
});

describe("Resilience: CircuitBreaker", () => {
  it("starts in CLOSED state and executes successful calls", async () => {
    const cb = new CircuitBreaker("test-service", { failureThreshold: 3 });
    expect(cb.getState()).toBe("CLOSED");

    const result = await cb.execute(async () => "ok");
    expect(result).toBe("ok");
    expect(cb.getState()).toBe("CLOSED");
  });

  it("trips to OPEN state after consecutive failures", async () => {
    const cb = new CircuitBreaker("failing-service", {
      failureThreshold: 2,
      recoveryTimeoutMs: 100,
    });

    // Failure 1
    await expect(cb.execute(async () => { throw new Error("Fail 1"); })).rejects.toThrow("Fail 1");
    expect(cb.getState()).toBe("CLOSED");

    // Failure 2 (Threshold reached)
    await expect(cb.execute(async () => { throw new Error("Fail 2"); })).rejects.toThrow("Fail 2");
    expect(cb.getState()).toBe("OPEN");

    // Next call fails fast without executing fn
    await expect(cb.execute(async () => "wont run")).rejects.toThrow(
      CircuitBreakerOpenError
    );
  });
});
