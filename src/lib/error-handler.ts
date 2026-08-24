import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "DATABASE_BUSY"
  | "TELEGRAM_ACCOUNT_NOT_FOUND"
  | "TELEGRAM_RATE_LIMITED"
  | "TELEGRAM_AUTH_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface UserFriendlyError {
  title: string;
  message: string;
  statusCode: number;
  code: ErrorCode;
}

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public userMessage: string;

  constructor(userMessage: string, statusCode = 400, code: ErrorCode = "INTERNAL_ERROR") {
    super(userMessage);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage;
  }
}

/**
 * Transforms any technical error into a polished, human-friendly message.
 * Ensures zero technical jargon, stack traces, or intimidating syntax is shown to users.
 */
export function formatUserFriendlyError(err: unknown): UserFriendlyError {
  if (err instanceof AppError) {
    return {
      title: "Notice",
      message: err.userMessage,
      statusCode: err.statusCode,
      code: err.code,
    };
  }

  if (err instanceof ZodError) {
    return {
      title: "Invalid Input",
      message: "Please double-check the details you entered and try again.",
      statusCode: 400,
      code: "VALIDATION_ERROR",
    };
  }

  const rawMessage = err instanceof Error ? err.message : String(err || "");
  const lower = rawMessage.toLowerCase();

  // Telegram MTProto errors
  if (lower.includes("username_not_occupied") || lower.includes("not found")) {
    return {
      title: "Account Not Found",
      message: "We couldn't find a public Telegram account with that username. Please verify the spelling.",
      statusCode: 404,
      code: "TELEGRAM_ACCOUNT_NOT_FOUND",
    };
  }

  if (
    lower.includes("flood_wait") ||
    lower.includes("a wait of") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit")
  ) {
    return {
      title: "Please Slow Down",
      message: "Telegram is asking us to pause for a moment. Please wait a few seconds and try again.",
      statusCode: 429,
      code: "TELEGRAM_RATE_LIMITED",
    };
  }

  if (lower.includes("phone_code_invalid")) {
    return {
      title: "Incorrect Code",
      message: "The Telegram verification code entered is incorrect. Please check your Telegram chat and try again.",
      statusCode: 400,
      code: "TELEGRAM_AUTH_FAILED",
    };
  }

  if (lower.includes("phone_code_expired")) {
    return {
      title: "Code Expired",
      message: "The Telegram login code has expired. Please request a new code to continue.",
      statusCode: 400,
      code: "TELEGRAM_AUTH_FAILED",
    };
  }

  if (lower.includes("phone_number_invalid")) {
    return {
      title: "Invalid Phone Number",
      message: "Please enter a valid international phone number starting with + and country code.",
      statusCode: 400,
      code: "TELEGRAM_AUTH_FAILED",
    };
  }

  if (lower.includes("password_hash_invalid")) {
    return {
      title: "Incorrect 2FA Password",
      message: "Your Telegram 2-Step Verification password was incorrect. Please try again.",
      statusCode: 400,
      code: "TELEGRAM_AUTH_FAILED",
    };
  }

  // Database / Network / Timeout errors
  if (
    lower.includes("database") ||
    lower.includes("postgres") ||
    lower.includes("econnrefused") ||
    lower.includes("connection") ||
    lower.includes("timeout") ||
    lower.includes("circuit breaker")
  ) {
    return {
      title: "Service Syncing",
      message: "Our systems are currently synchronizing data. We're handling it — please try again shortly.",
      statusCode: 503,
      code: "DATABASE_BUSY",
    };
  }

  // Default fallback for any unhandled or unknown error
  return {
    title: "We're On It",
    message: "An unexpected hiccup occurred. We're handling it! Please refresh or try again in a moment.",
    statusCode: 500,
    code: "INTERNAL_ERROR",
  };
}

/**
 * Standard API error handler generating clean, safe JSON responses.
 */
export function handleApiError(err: unknown, requestId?: string): NextResponse {
  const formatted = formatUserFriendlyError(err);

  return NextResponse.json(
    {
      success: false,
      error: formatted.title,
      message: formatted.message,
      code: formatted.code,
      requestId: requestId || crypto.randomUUID(),
    },
    {
      status: formatted.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
