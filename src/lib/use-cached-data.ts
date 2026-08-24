"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const memoryCache = new Map<string, { data: any; timestamp: number }>();

export interface UseCachedDataOptions {
  ttlMs?: number; // Cache freshness window (default: 30s)
  revalidateOnFocus?: boolean;
}

export function useCachedData<T = any>(
  url: string | null,
  options: UseCachedDataOptions = {}
) {
  const { ttlMs = 30000, revalidateOnFocus = true } = options;

  // Initialize state synchronously from memory cache if present
  const [data, setData] = useState<T | null>(() => {
    if (!url) return null;
    const cached = memoryCache.get(url);
    if (cached) return cached.data as T;

    // Fallback check sessionStorage
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(`cache:${url}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < ttlMs * 2) {
            memoryCache.set(url, parsed);
            return parsed.data as T;
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!url) return false;
    const cached = memoryCache.get(url);
    return !cached;
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!url || isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        if (!isBackground && !data) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `HTTP ${res.status}`);
        }

        const freshData = await res.json();
        const cacheEntry = { data: freshData, timestamp: Date.now() };

        memoryCache.set(url, cacheEntry);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`cache:${url}`, JSON.stringify(cacheEntry));
          } catch {
            // Storage quota exceeded or private browsing
          }
        }

        setData(freshData);
        setError(null);
      } catch (err: any) {
        setError(err);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [url, data]
  );

  useEffect(() => {
    if (!url) return;

    const cached = memoryCache.get(url);
    const isStale = !cached || Date.now() - cached.timestamp > ttlMs;

    if (isStale) {
      fetchData(Boolean(cached));
    }
  }, [url, ttlMs, fetchData]);

  // Revalidate when user returns to window/tab
  useEffect(() => {
    if (!revalidateOnFocus || !url) return;

    const onFocus = () => {
      const cached = memoryCache.get(url);
      if (!cached || Date.now() - cached.timestamp > ttlMs) {
        fetchData(true);
      }
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [revalidateOnFocus, url, ttlMs, fetchData]);

  const mutate = useCallback(
    (updater: T | ((current: T | null) => T), shouldRevalidate = false) => {
      if (!url) return;

      const updated =
        typeof updater === "function"
          ? (updater as (current: T | null) => T)(data)
          : updater;

      setData(updated);
      memoryCache.set(url, { data: updated, timestamp: Date.now() });

      if (shouldRevalidate) {
        fetchData(true);
      }
    },
    [url, data, fetchData]
  );

  const revalidate = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    mutate,
    revalidate,
  };
}
