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
  ssl: { rejectUnauthorized: false } // Required for Digital Ocean managed databases
});

// Create Drizzle client using the pool
export const db = drizzle(pool, { schema });