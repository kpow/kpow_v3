
import { drizzle } from "drizzle-orm/neon-serverless";
import pkg from 'pg';
const { Pool } = pkg;
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create PostgreSQL pool with optimized settings for Neon serverless
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace('.us-east-2', '-pooler.us-east-2'),
  max: 5, // Reduce max connections
  idleTimeoutMillis: 15000, // Shorter idle timeout
  connectionTimeoutMillis: 10000, // Longer connection timeout
  maxUses: 1000, // Lower max uses to prevent connection staleness
  keepAlive: true, // Enable TCP keepalive
  statement_timeout: 10000, // Statement timeout in ms
  query_timeout: 10000, // Query timeout in ms
});

// Add event listeners for connection issues
// Connection monitoring
pool.on('error', (err, client) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

// Create Drizzle client with optimized connection
export const db = drizzle({
  connection: process.env.DATABASE_URL?.replace('.us-east-2', '-pooler.us-east-2'),
  schema,
  ws: ws,
});
