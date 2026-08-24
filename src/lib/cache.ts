/**
 * High-Performance In-Memory Cache with TTL and Key Pattern Invalidation
 * Drastically cuts down PostgreSQL queries and provides sub-millisecond responses.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class FastCache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds = 60): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 60
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public invalidatePattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  public clear(): void {
    this.store.clear();
  }

  private startCleanup(): void {
    if (typeof window !== "undefined") return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.expiresAt) {
          this.store.delete(key);
        }
      }
    }, 30000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

export const cache = new FastCache();
