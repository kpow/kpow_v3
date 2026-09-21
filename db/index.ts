import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@db/schema";

// Digital Ocean managed databases use self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create PostgreSQL pool for session management and Drizzle
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  ssl: { rejectUnauthorized: false }, // Required for Digital Ocean managed databases
  // Self-heal after DB maintenance or a dropped network path. Without these, dead
  // pooled sockets hang every query forever and the whole site's DB routes stall
  // (2026-09-21: the vizSpot relay showed RELAY OFFLINE until the app restarted).
  keepAlive: true,                 // TCP keepalive notices half-open sockets
  connectionTimeoutMillis: 10_000, // give up on a new connection instead of waiting forever
  idleTimeoutMillis: 30_000,       // recycle idle clients so stale ones don't linger
  query_timeout: 30_000,           // fail a hung query, which also frees its client
});

// An idle client dying (DB restart, failover) emits 'error' on the pool; without a
// listener Node treats it as unhandled and crashes the process.
pool.on("error", (err) => {
  console.error("[db] idle client error, pool will replace it:", err.message);
});

// Create Drizzle client using the pool
export const db = drizzle(pool, { schema });