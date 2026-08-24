import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getTelegramClient } from "@/tracker/client/client-factory";
import { AccountRepository } from "@/server/repositories/account.repository";

export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "healthy",
    telegramTracker: "connected",
    activeAccounts: 0,
  };

  try {
    // Check PostgreSQL connectivity
    await db.execute(sql`SELECT 1`);
    const active = await AccountRepository.listAllActive();
    status.activeAccounts = active.length;

    const client = getTelegramClient();
    status.telegramTracker = client.isConnected() ? "connected" : "ready";

    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err.message || "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
