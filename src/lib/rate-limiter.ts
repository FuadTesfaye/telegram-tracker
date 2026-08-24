/**
 * In-Memory Sliding Window Rate Limiter
 * Provides microsecond-level rate-limiting per client IP / user ID with multiple tiers.
 */

export type RateLimitTier =
  | "GLOBAL"
  | "API_DEFAULT"
  | "MUTATION"
  | "ROAST_ENGINE"
  | "HISTORICAL_SCAN"
  | "AUTH_CODE"
  | "BOT_WEBHOOK";

interface TierConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMIT_CONFIGS: Record<RateLimitTier, TierConfig> = {
  GLOBAL: { maxRequests: 300, windowMs: 60 * 1000 },
  API_DEFAULT: { maxRequests: 120, windowMs: 60 * 1000 },
  MUTATION: { maxRequests: 40, windowMs: 60 * 1000 },
  ROAST_ENGINE: { maxRequests: 25, windowMs: 60 * 1000 },
  HISTORICAL_SCAN: { maxRequests: 8, windowMs: 60 * 1000 },
  AUTH_CODE: { maxRequests: 6, windowMs: 60 * 1000 },
  BOT_WEBHOOK: { maxRequests: 200, windowMs: 10 * 1000 },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSecs: number;
}

interface ClientRecord {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private records = new Map<string, ClientRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Evaluates if a request from a client key within a specific tier is allowed.
   */
  public check(key: string, tier: RateLimitTier = "API_DEFAULT"): RateLimitResult {
    const config = RATE_LIMIT_CONFIGS[tier];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const bucketKey = `${tier}:${key}`;

    let record = this.records.get(bucketKey);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(bucketKey, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentCount = record.timestamps.length;
    const isAllowed = currentCount < config.maxRequests;

    if (isAllowed) {
      record.timestamps.push(now);
    }

    const remaining = Math.max(0, config.maxRequests - record.timestamps.length);
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimeMs = oldestTimestamp + config.windowMs;
    const retryAfterSecs = isAllowed ? 0 : Math.ceil((resetTimeMs - now) / 1000);

    return {
      success: isAllowed,
      limit: config.maxRequests,
      remaining,
      resetTimeMs,
      retryAfterSecs,
    };
  }

  /**
   * Periodically purges stale entries to prevent memory leaks.
   */
  private startCleanup() {
    if (typeof window !== "undefined") return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxWindow = 5 * 60 * 1000; // 5 min max window

      for (const [key, record] of this.records.entries()) {
        record.timestamps = record.timestamps.filter((ts) => now - ts < maxWindow);
        if (record.timestamps.length === 0) {
          this.records.delete(key);
        }
      }
    }, 60000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public getStats() {
    return {
      trackedBuckets: this.records.size,
      configs: RATE_LIMIT_CONFIGS,
    };
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();
