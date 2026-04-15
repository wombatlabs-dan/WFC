// ---------------------------------------------------------------------------
// Node.js singleton — used by seed scripts and local dev (Express api-server)
// ---------------------------------------------------------------------------
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export * from "./schema";

const { Pool } = pg;

// Lazy singleton so Workers can import this module for types/schema
// without DATABASE_URL being set at import time.
let _pool: InstanceType<typeof Pool> | undefined;
let _db: ReturnType<typeof drizzleNodePg<typeof schema>> | undefined;

function getNodePgDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzleNodePg(_pool, { schema });
  }
  return _db;
}

// Proxied exports keep backwards compat with api-server and seed script
export const pool = new Proxy({} as InstanceType<typeof Pool>, {
  get(_, key) {
    getNodePgDb();
    return (_pool as any)[key as string];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzleNodePg<typeof schema>>, {
  get(_, key) {
    return (getNodePgDb() as any)[key as string];
  },
});

// ---------------------------------------------------------------------------
// Workers factory — Neon serverless HTTP driver (no TCP/WebSockets)
// ---------------------------------------------------------------------------
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

export type WorkerDb = ReturnType<typeof drizzleNeon<typeof schema>>;

/**
 * Create a Drizzle db instance backed by Neon's HTTP driver.
 * Call once per Worker request. No persistent connection needed.
 */
export function createDb(connectionString: string): WorkerDb {
  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}
