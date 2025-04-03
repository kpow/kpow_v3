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

// Create PostgreSQL pool for session management
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20 // Maximum number of clients in the pool
});

// Create Drizzle client
export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});