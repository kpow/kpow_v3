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
  max: 3, // Reduce max connections further
  idleTimeoutMillis: 30000, // Longer idle timeout
  connectionTimeoutMillis: 15000, // Increased connection timeout
  maxUses: 500, // Reduce max uses
  statement_timeout: 20000,
  query_timeout: 20000,
  ssl: {
    rejectUnauthorized: false // Required for some Neon connections
  }
});

// Add event listeners for connection issues
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Attempt to close the client if it exists
  if (client) {
    client.release(true); // Force release with error
  }
});

// Add connect listener
pool.on('connect', (client) => {
  console.log('New client connected to pool');
});

// Create Drizzle client with optimized connection
export const db = drizzle({
  connection: process.env.DATABASE_URL?.replace('.us-east-2', '-pooler.us-east-2'),
  schema,
  ws: ws,
});