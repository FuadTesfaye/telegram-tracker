import { NextResponse } from "next/server";
import { db, dbCluster } from "@/db";
import { sql } from "drizzle-orm";
import { getTelegramClient } from "@/tracker/client/client-factory";
import { AccountRepository } from "@/server/repositories/account.repository";
import { queueManager } from "@/lib/queue-manager";
import { rateLimiter } from "@/lib/rate-limiter";
import { groqLoadBalancer } from "@/lib/groq-load-balancer";

export async function GET() {
  const start = Date.now();

  try {
    // Check PostgreSQL connectivity via load balancer cluster
    await db.execute(sql`SELECT 1 as ping`);
    const active = await AccountRepository.listAllActive();

    const client = getTelegramClient();
    const telegramStatus = client.isConnected() ? "connected" : "ready";

    const cluster = dbCluster.getClusterStatus();
    const queue = queueManager.getStats();
    const rateLimits = rateLimiter.getStats();
    const groq = groqLoadBalancer.getStats();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      database: {
        status: cluster.healthyNodes > 0 ? "healthy" : "degraded",
        cluster,
      },
      queue,
      rateLimiter: {
        activeBuckets: rateLimits.trackedBuckets,
      },
      groqLoadBalancer: groq,
      telegramTracker: telegramStatus,
      activeAccounts: active.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "degraded",
        error: err.message || "Health check degraded",
        timestamp: new Date().toISOString(),
        database: dbCluster.getClusterStatus(),
        queue: queueManager.getStats(),
      },
      { status: 503 }
    );
  }
}
