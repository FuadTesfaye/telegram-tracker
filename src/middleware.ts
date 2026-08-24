import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimiter, type RateLimitTier } from "./lib/rate-limiter";

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

function resolveTierForPath(pathname: string, method: string): RateLimitTier {
  if (pathname.startsWith("/api/bot")) {
    return "BOT_WEBHOOK";
  }
  if (pathname.startsWith("/api/auth")) {
    return "AUTH_CODE";
  }
  if (pathname.includes("/scan") || pathname.includes("/history")) {
    return "HISTORICAL_SCAN";
  }
  if (pathname.includes("/roast")) {
    return "ROAST_ENGINE";
  }
  if (["POST", "PATCH", "DELETE", "PUT"].includes(method.toUpperCase())) {
    return "MUTATION";
  }
  return "API_DEFAULT";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Health check endpoint is always open
  if (pathname === "/api/health") {
    const res = NextResponse.next();
    res.headers.set("x-request-id", crypto.randomUUID());
    return res;
  }

  const clientIp = getClientIdentifier(req);
  const tier = resolveTierForPath(pathname, req.method);
  const result = rateLimiter.check(clientIp, tier);

  const requestId = crypto.randomUUID();

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too Many Requests",
        message: `Rate limit exceeded for tier [${tier}]. Please retry after ${result.retryAfterSecs}s.`,
        retryAfter: result.retryAfterSecs,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSecs),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetTimeMs),
          "x-request-id": requestId,
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset", String(result.resetTimeMs));
  res.headers.set("x-request-id", requestId);

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
