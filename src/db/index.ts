export * from "./schema";
export { dbCluster, db } from "../lib/db-load-balancer";
export type { DatabaseNode } from "../lib/db-load-balancer";
import { db } from "../lib/db-load-balancer";
export type Database = typeof db;
