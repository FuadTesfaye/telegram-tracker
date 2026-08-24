import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { env } from "./env";
import { CircuitBreaker, retryWithBackoff } from "./resilience";

export interface DatabaseNode {
  id: string;
  name: string;
  url: string;
  client: postgres.Sql;
  db: ReturnType<typeof drizzle<typeof schema>>;
  circuitBreaker: CircuitBreaker;
  isHealthy: boolean;
  latencyMs: number;
  lastCheckedAt: Date;
  consecutiveFailures: number;
  totalQueries: number;
  totalErrors: number;
}

class DatabaseLoadBalancer {
  private nodes: DatabaseNode[] = [];
  private roundRobinIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeNodes();
    this.startHealthCheck();
  }

  private initializeNodes() {
    const rawUrls = [
      { name: "Primary DB", url: env.DATABASE_URL },
      { name: "Replica 1", url: env.DB_URL_1 },
      { name: "Replica 2", url: env.DB_URL_2 },
      { name: "Replica 3", url: env.DB_URL_3 },
    ].filter((item): item is { name: string; url: string } => Boolean(item.url));

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueList: { name: string; url: string }[] = [];

    for (const item of rawUrls) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        uniqueList.push(item);
      }
    }

    this.nodes = uniqueList.map((item, idx) => {
      const client = postgres(item.url, {
        prepare: false, // required for Supabase transaction pooler (pgbouncer)
        max: 15,
        idle_timeout: 30,
        connect_timeout: 8,
        onnotice: () => {}, // silence notice spam
      });

      const db = drizzle(client, { schema });
      const circuitBreaker = new CircuitBreaker(`db-node-${idx}-${item.name}`, {
        failureThreshold: 3,
        recoveryTimeoutMs: 10000,
      });

      return {
        id: `node-${idx}`,
        name: item.name,
        url: item.url,
        client,
        db,
        circuitBreaker,
        isHealthy: true,
        latencyMs: 0,
        lastCheckedAt: new Date(),
        consecutiveFailures: 0,
        totalQueries: 0,
        totalErrors: 0,
      };
    });
  }

  /**
   * Performs an active health check on a node.
   */
  public async checkNodeHealth(node: DatabaseNode): Promise<boolean> {
    const start = Date.now();
    try {
      await node.client`SELECT 1 as health_check`;
      node.latencyMs = Date.now() - start;
      node.isHealthy = true;
      node.consecutiveFailures = 0;
      node.lastCheckedAt = new Date();
      return true;
    } catch {
      node.latencyMs = Date.now() - start;
      node.consecutiveFailures++;
      node.totalErrors++;
      if (node.consecutiveFailures >= 2) {
        node.isHealthy = false;
      }
      node.lastCheckedAt = new Date();
      return false;
    }
  }

  private startHealthCheck() {
    if (typeof window !== "undefined") return; // Server-only

    this.healthCheckInterval = setInterval(async () => {
      await Promise.all(this.nodes.map((node) => this.checkNodeHealth(node)));
    }, 30000);

    // Unref so it doesn't block process exit in scripts/tests
    if (this.healthCheckInterval.unref) {
      this.healthCheckInterval.unref();
    }
  }

  /**
   * Returns the primary or next available write-capable database node.
   */
  public getWriteNode(): DatabaseNode {
    const primary = this.nodes[0];
    if (primary && primary.isHealthy) {
      primary.totalQueries++;
      return primary;
    }

    const healthyFallback = this.nodes.find((n) => n.isHealthy);
    if (healthyFallback) {
      healthyFallback.totalQueries++;
      return healthyFallback;
    }

    // Last resort
    return this.nodes[0];
  }

  /**
   * Load-balances read queries across healthy database nodes via Round-Robin.
   */
  public getReadNode(): DatabaseNode {
    const healthyNodes = this.nodes.filter((n) => n.isHealthy);
    if (healthyNodes.length === 0) {
      return this.nodes[0]; // Fallback to primary if all report down
    }

    const node = healthyNodes[this.roundRobinIndex % healthyNodes.length];
    this.roundRobinIndex++;
    node.totalQueries++;
    return node;
  }

  /**
   * Executes a database query with automatic failover and retry across available nodes.
   */
  public async executeWithFailover<T>(
    operation: (db: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>,
    type: "read" | "write" = "read"
  ): Promise<T> {
    return retryWithBackoff(
      async () => {
        const node = type === "write" ? this.getWriteNode() : this.getReadNode();
        try {
          return await node.circuitBreaker.execute(() => operation(node.db));
        } catch (err: any) {
          node.consecutiveFailures++;
          node.totalErrors++;
          if (node.consecutiveFailures >= 2) {
            node.isHealthy = false;
          }
          throw err;
        }
      },
      {
        maxRetries: Math.max(2, this.nodes.length - 1),
        initialDelayMs: 100,
        maxDelayMs: 1500,
      }
    );
  }

  /**
   * Returns current telemetry and health status of all database pools.
   */
  public getClusterStatus() {
    return {
      totalNodes: this.nodes.length,
      healthyNodes: this.nodes.filter((n) => n.isHealthy).length,
      nodes: this.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        isHealthy: n.isHealthy,
        latencyMs: n.latencyMs,
        consecutiveFailures: n.consecutiveFailures,
        totalQueries: n.totalQueries,
        totalErrors: n.totalErrors,
        circuitState: n.circuitBreaker.getState(),
        lastCheckedAt: n.lastCheckedAt.toISOString(),
      })),
    };
  }
}

export const dbCluster = new DatabaseLoadBalancer();
export const db = dbCluster.getWriteNode().db;
