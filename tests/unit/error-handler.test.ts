import { describe, it, expect } from "vitest";
import {
  AppError,
  formatUserFriendlyError,
  handleApiError,
} from "../../src/lib/error-handler";
import { z } from "zod";

describe("Error Handler: formatUserFriendlyError", () => {
  it("formats custom AppError correctly", () => {
    const err = new AppError("You must enroll at least 2 accounts", 400, "NOT_FOUND");
    const formatted = formatUserFriendlyError(err);

    expect(formatted.statusCode).toBe(400);
    expect(formatted.code).toBe("NOT_FOUND");
    expect(formatted.message).toBe("You must enroll at least 2 accounts");
  });

  it("formats Zod validation error cleanly without technical syntax", () => {
    const schema = z.object({ username: z.string().min(3) });
    const result = schema.safeParse({ username: "a" });
    if (!result.success) {
      const formatted = formatUserFriendlyError(result.error);
      expect(formatted.statusCode).toBe(400);
      expect(formatted.code).toBe("VALIDATION_ERROR");
      expect(formatted.message).toContain("double-check the details");
    }
  });

  it("translates Telegram MTProto username not found error", () => {
    const err = new Error("USERNAME_NOT_OCCUPIED");
    const formatted = formatUserFriendlyError(err);

    expect(formatted.statusCode).toBe(404);
    expect(formatted.code).toBe("TELEGRAM_ACCOUNT_NOT_FOUND");
    expect(formatted.message).toContain("couldn't find a public Telegram account");
  });

  it("translates Telegram FLOOD_WAIT rate limits to friendly pause message", () => {
    const err = new Error("A wait of 45 seconds is required (caused by contacts.ResolveUsername)");
    const formatted = formatUserFriendlyError(err);

    expect(formatted.statusCode).toBe(429);
    expect(formatted.code).toBe("TELEGRAM_RATE_LIMITED");
    expect(formatted.message).toContain("Telegram is asking us to pause for a moment");
  });

  it("translates Telegram auth code errors", () => {
    const err = new Error("PHONE_CODE_INVALID");
    const formatted = formatUserFriendlyError(err);

    expect(formatted.statusCode).toBe(400);
    expect(formatted.code).toBe("TELEGRAM_AUTH_FAILED");
    expect(formatted.message).toContain("verification code entered is incorrect");
  });

  it("translates database connection errors to graceful sync message", () => {
    const err = new Error("ECONNREFUSED: Connection pool timed out");
    const formatted = formatUserFriendlyError(err);

    expect(formatted.statusCode).toBe(503);
    expect(formatted.code).toBe("DATABASE_BUSY");
    expect(formatted.message).toContain("synchronizing data");
  });

  it("provides reassuring default fallback for completely unknown errors", () => {
    const err = new Error("Null pointer dereference 0x89abcdef in v8 isolate");
    const formatted = formatUserFriendlyError(err);

    expect(formatted.statusCode).toBe(500);
    expect(formatted.code).toBe("INTERNAL_ERROR");
    expect(formatted.title).toBe("We're On It");
    expect(formatted.message).toContain("An unexpected hiccup occurred. We're handling it!");
  });
});

describe("Error Handler: handleApiError", () => {
  it("produces standard NextResponse with safe payload", async () => {
    const err = new Error("Unknown database fault");
    const res = handleApiError(err);

    expect(res.status).toBe(503); // because database is detected
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
    expect(body.message).toBeTruthy();
    expect(body.requestId).toBeTruthy();
    // Ensure no raw stack trace is leaked
    expect(body.stack).toBeUndefined();
  });
});
