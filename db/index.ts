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
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500, // Close connections after 7500 queries
});

// Create Drizzle client with pooled connection
export const db = drizzle({
  connection: process.env.DATABASE_URL?.replace('.us-east-2', '-pooler.us-east-2'),
  schema,
  ws: ws,
});