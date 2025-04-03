import { drizzle } from "drizzle-orm/neon-serverless";
import pkg from 'pg';
const { Pool } = pkg;
import ws from "ws";
import * as schema from "@db/schema";
import { executeWithRetry } from "../server/utils/db-helpers";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create PostgreSQL pool with improved connection settings for Replit environment
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3, // Even more limited connections for stability
  min: 0, // Don't keep any idle connections
  idleTimeoutMillis: 5000, // Close idle connections after 5 seconds
  connectionTimeoutMillis: 3000, // Even more aggressive connection timeout (3 seconds)
  query_timeout: 3000, // Set query timeout to 3 seconds
  allowExitOnIdle: true, // Allow the process to exit if pool is idle
  ssl: { rejectUnauthorized: false }, // Accept self-signed certificates if needed
  // Add statement_timeout to prevent long-running queries
  statement_timeout: 3000, // 3 seconds timeout for statements
  // Add more conservative retry parameters
  max_retries: 2, // Maximum number of query retries
  retry_delay: 150, // Milliseconds between retries
  keepalive: true, // Enable TCP keepalive
  keepaliveInitialDelayMillis: 5000 // Initial delay for TCP keepalive
});

// Log pool events for better monitoring
pool.on('connect', () => console.log('[DB] New client connected to pool'));
pool.on('acquire', (client) => console.log('[DB] Client acquired from pool'));
pool.on('error', (err, client) => {
  console.error('[DB] Pool error:', err.message);
  console.error('[DB] Error stack:', err.stack);
  if (err.cause) {
    console.error('[DB] Error cause:', err.cause);
  }
});
pool.on('remove', () => console.log('[DB] Client removed from pool'));

// Use executeWithRetry function for resilient database operations

// Test database connection with retry logic
(async () => {
  try {
    console.log('[DB] Testing database connection with retry logic...');
    
    await executeWithRetry(async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT NOW() as time');
        console.log(`[DB] Connection test successful at ${result.rows[0].time}`);
        return true;
      } finally {
        client.release();
        console.log('[DB] Test client released');
      }
    }, 3); // Retry up to 3 times
    
    console.log('[DB] Connection established successfully');
  } catch (err) {
    console.error('[DB] Failed to establish database connection after retries:', err.message);
    if (err.cause) {
      console.error('[DB] Error cause:', err.cause);
    }
    // Don't exit process - allow application to handle reconnection logic
    console.error('[DB] Application will continue to run and attempt to reconnect as needed');
  }
})();

// Create Drizzle client
export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws, // Keep the WebSocket configuration for now
});