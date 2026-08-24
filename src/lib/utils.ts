import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats duration in seconds to human-readable string (e.g. "3h 18m", "45m", "12s")
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Formats percentage with sign (+18%, -12%, 0%)
 */
export function formatPercentage(value: number): string {
  if (isNaN(value)) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Safe number rounding
 */
export function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format ISO date string into readable Date representation (e.g., "Aug 24, 2026")
 */
export function formatDate(date: string | Date, timezone: string = "UTC"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });
}

/**
 * Format time to HH:MM format
 */
export function formatTime(date: string | Date, timezone: string = "UTC"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
}

/**
 * Normalize username string: "@alice", "https://t.me/alice", "t.me/alice", "alice" -> "alice"
 */
export function normalizeUsername(input: string): string {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, "");
  cleaned = cleaned.replace(/^t\.me\//i, "");
  cleaned = cleaned.replace(/^@/, "");
  return cleaned.toLowerCase();
}
