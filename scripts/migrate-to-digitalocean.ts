/**
 * Database Migration Script: Neon to Digital Ocean PostgreSQL
 *
 * This script performs a one-time full database copy from Neon serverless PostgreSQL
 * to Digital Ocean managed PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-digitalocean.ts [options]
 *
 * Options:
 *   --dry-run      Create schema only, then rollback (no data migration)
 *   --verify-only  Compare row counts without making any changes
 *   --skip-errors  Continue on row errors, log failures to migration-errors.json
 *   --verbose      Show detailed per-row logging
 *
 * Environment Variables:
 *   DATABASE_URL     - Source database (Neon)
 *   DO_DATABASE_URL  - Target database (Digital Ocean)
 */

import pg from 'pg';
import { writeFileSync } from 'fs';

// Digital Ocean managed databases use certificates that Node.js doesn't trust by default
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verifyOnly = args.includes('--verify-only');
const skipErrors = args.includes('--skip-errors');
const verbose = args.includes('--verbose');

// Table configuration with columns
interface TableConfig {
  name: string;
  columns: string[];
  hasSerial: boolean;
}

// Tables ordered by FK dependencies
const TABLES: TableConfig[] = [
  // Tier 1 - No Dependencies
  {
    name: 'users',
    columns: ['id', 'username', 'password', 'approved', 'created_at'],
    hasSerial: true
  },
  {
    name: 'artists',
    columns: ['id', 'name', 'image_url', 'artist_image_url', 'bio', 'listeners', 'playcount', 'last_updated'],
    hasSerial: true
  },
  {
    name: 'authors',
    columns: ['id', 'goodreads_id', 'name', 'image_url', 'average_rating', 'ratings_count', 'text_reviews_count', 'date_created', 'last_updated'],
    hasSerial: true
  },
  {
    name: 'shelves',
    columns: ['id', 'name', 'date_created'],
    hasSerial: true
  },
  {
    name: 'books',
    columns: ['id', 'goodreads_id', 'title', 'title_without_series', 'description', 'image_url', 'link', 'average_rating', 'pages', 'publication_year', 'isbn', 'isbn13', 'publisher', 'language', 'date_added', 'date_read', 'user_rating', 'date_created', 'last_updated'],
    hasSerial: true
  },

  // Tier 2 - Depends on Tier 1
  {
    name: 'songs',
    columns: ['id', 'name', 'album_name', 'container_album_name', 'container_type', 'media_duration_ms', 'artist_id'],
    hasSerial: true
  },

  // Tier 3 - Depends on Tier 2
  {
    name: 'plays',
    columns: ['id', 'song_id', 'start_timestamp', 'end_timestamp', 'play_duration_ms', 'end_position_ms', 'end_reason_type', 'feature_name', 'event_type'],
    hasSerial: true
  },

  // Tier 4 - Junction Tables (composite PKs, no serial)
  {
    name: 'book_authors',
    columns: ['book_id', 'author_id', 'role'],
    hasSerial: false
  },
  {
    name: 'book_shelves',
    columns: ['book_id', 'shelf_id', 'date_added'],
    hasSerial: false
  },
];

// Schema DDL statements derived from db/schema.ts
const SCHEMA_DDL = `
-- Tier 1: No Dependencies

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(256) NOT NULL UNIQUE,
  password VARCHAR(256) NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  image_url TEXT,
  artist_image_url TEXT,
  bio TEXT,
  listeners INTEGER,
  playcount INTEGER,
  last_updated TIMESTAMP
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  goodreads_id TEXT UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  average_rating TEXT,
  ratings_count INTEGER,
  text_reviews_count INTEGER,
  date_created TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Shelves table
CREATE TABLE IF NOT EXISTS shelves (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  date_created TIMESTAMP DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  goodreads_id TEXT UNIQUE,
  title TEXT NOT NULL,
  title_without_series TEXT,
  description TEXT,
  image_url TEXT,
  link TEXT,
  average_rating TEXT,
  pages INTEGER,
  publication_year INTEGER,
  isbn TEXT,
  isbn13 TEXT,
  publisher TEXT,
  language TEXT,
  date_added TIMESTAMP,
  date_read TIMESTAMP,
  user_rating TEXT,
  date_created TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Tier 2: Depends on Tier 1

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  album_name TEXT,
  container_album_name TEXT,
  container_type TEXT,
  media_duration_ms INTEGER,
  artist_id INTEGER REFERENCES artists(id),
  CONSTRAINT songs_name_artist_id_unique UNIQUE (name, artist_id)
);

-- Tier 3: Depends on Tier 2

-- Plays table
CREATE TABLE IF NOT EXISTS plays (
  id SERIAL PRIMARY KEY,
  song_id INTEGER REFERENCES songs(id),
  start_timestamp TIMESTAMP NOT NULL,
  end_timestamp TIMESTAMP NOT NULL,
  play_duration_ms INTEGER NOT NULL,
  end_position_ms INTEGER,
  end_reason_type TEXT,
  feature_name TEXT,
  event_type TEXT
);

-- Tier 4: Junction Tables

-- Book Authors (many-to-many)
CREATE TABLE IF NOT EXISTS book_authors (
  book_id INTEGER NOT NULL REFERENCES books(id),
  author_id INTEGER NOT NULL REFERENCES authors(id),
  role TEXT,
  PRIMARY KEY (book_id, author_id)
);

-- Book Shelves (many-to-many)
CREATE TABLE IF NOT EXISTS book_shelves (
  book_id INTEGER NOT NULL REFERENCES books(id),
  shelf_id INTEGER NOT NULL REFERENCES shelves(id),
  date_added TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (book_id, shelf_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_plays_song_id ON plays(song_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_book_shelves_book_id ON book_shelves(book_id);
CREATE INDEX IF NOT EXISTS idx_book_shelves_shelf_id ON book_shelves(shelf_id);
`;

// Track failed rows for --skip-errors mode
interface FailedRow {
  table: string;
  id: number | string;
  error: string;
}
const failedRows: FailedRow[] = [];

/**
 * Validate that required environment variables are set
 */
function validateEnvironment(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required (source Neon database)');
  }
  if (!process.env.DO_DATABASE_URL) {
    throw new Error('DO_DATABASE_URL environment variable is required (target Digital Ocean database)');
  }
}

/**
 * Create connections to both source and target databases
 */
async function createConnections(): Promise<{ source: pg.Pool; target: pg.Pool }> {
  // Neon supports standard PostgreSQL connections
  const source = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const target = new pg.Pool({
    connectionString: process.env.DO_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Test connections
  console.log('  Testing source connection (Neon)...');
  await source.query('SELECT 1');
  console.log('  Source: Connected');

  console.log('  Testing target connection (Digital Ocean)...');
  await target.query('SELECT 1');
  console.log('  Target: Connected');

  return { source, target };
}

/**
 * Create schema on target database
 */
async function createSchema(client: pg.PoolClient): Promise<void> {
  await client.query(SCHEMA_DDL);
  console.log('  Created 9 tables and indexes');
}

/**
 * Migrate data from a single table
 */
async function migrateTable(
  source: pg.Pool,
  client: pg.PoolClient,
  table: TableConfig,
  batchSize: number = 100
): Promise<number> {
  // Fetch all rows from source
  const { rows } = await source.query(`SELECT * FROM ${table.name}`);

  if (rows.length === 0) {
    console.log(`  ${table.name}: 0 rows (empty table)`);
    return 0;
  }

  // Build insert statement
  const columns = table.columns.join(', ');
  const placeholders = table.columns.map((_, i) => `$${i + 1}`).join(', ');
  const insertSQL = `INSERT INTO ${table.name} (${columns}) VALUES (${placeholders})`;

  // Insert rows
  let inserted = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const values = table.columns.map(col => row[col]);
      await client.query(insertSQL, values);
      inserted++;

      if (verbose) {
        console.log(`    Inserted ${table.name} id=${row.id || `${row.book_id},${row.author_id || row.shelf_id}`}`);
      }
    } catch (error) {
      const err = error as Error;
      if (skipErrors) {
        failedRows.push({
          table: table.name,
          id: row.id || `${row.book_id},${row.author_id || row.shelf_id}`,
          error: err.message
        });
        console.log(`    SKIP: ${table.name} - ${err.message}`);
      } else {
        throw error;
      }
    }

    // Progress reporting every batch
    if ((i + 1) % batchSize === 0 || i === rows.length - 1) {
      const progress = Math.round(((i + 1) / rows.length) * 100);
      process.stdout.write(`\r  ${table.name}: ${i + 1}/${rows.length} (${progress}%)`);
    }
  }

  console.log(`\r  ${table.name}: ${inserted}/${rows.length} rows migrated`);
  return inserted;
}

/**
 * Reset sequences to continue from max ID
 */
async function resetSequence(client: pg.PoolClient, tableName: string): Promise<void> {
  try {
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('${tableName}', 'id'),
        COALESCE((SELECT MAX(id) FROM ${tableName}), 0) + 1,
        false
      )
    `);
  } catch (error) {
    // Some tables might not have sequences, that's okay
    if (verbose) {
      console.log(`    Note: No sequence to reset for ${tableName}`);
    }
  }
}

/**
 * Verify migration by comparing row counts
 */
async function verifyMigration(
  source: pg.Pool,
  target: pg.Pool
): Promise<{ table: string; source: number; target: number; match: boolean }[]> {
  const results = [];

  for (const table of TABLES) {
    try {
      const sourceCount = await source.query(`SELECT COUNT(*) FROM ${table.name}`);
      const targetCount = await target.query(`SELECT COUNT(*) FROM ${table.name}`);

      const sourceN = parseInt(sourceCount.rows[0].count);
      const targetN = parseInt(targetCount.rows[0].count);

      results.push({
        table: table.name,
        source: sourceN,
        target: targetN,
        match: sourceN === targetN
      });
    } catch (error) {
      // Table might not exist in target yet
      results.push({
        table: table.name,
        source: -1,
        target: -1,
        match: false
      });
    }
  }

  return results;
}

/**
 * Format a table for console output
 */
function printTable(data: { table: string; source: number; target: number; match: boolean }[]): void {
  console.log('');
  console.log('| Table                        | Source | Target | Match |');
  console.log('|------------------------------|--------|--------|-------|');
  for (const row of data) {
    const tablePadded = row.table.padEnd(28);
    const sourcePadded = row.source.toString().padStart(6);
    const targetPadded = row.target.toString().padStart(6);
    const matchStr = row.match ? 'Yes' : 'NO';
    console.log(`| ${tablePadded} | ${sourcePadded} | ${targetPadded} | ${matchStr.padStart(5)} |`);
  }
  console.log('');
}

/**
 * Main migration function
 */
async function main() {
  const startTime = Date.now();

  console.log('=== kpow_v3 Database Migration ===');
  console.log('Source: Neon PostgreSQL');
  console.log('Target: Digital Ocean PostgreSQL');
  console.log('');
  console.log('Options:');
  console.log(`  --dry-run: ${dryRun}`);
  console.log(`  --verify-only: ${verifyOnly}`);
  console.log(`  --skip-errors: ${skipErrors}`);
  console.log(`  --verbose: ${verbose}`);
  console.log('');

  try {
    // Step 1: Validate environment
    console.log('[1/6] Validating environment...');
    validateEnvironment();
    console.log('  Environment variables OK');

    // Step 2: Create connections
    console.log('[2/6] Establishing connections...');
    const { source, target } = await createConnections();

    // Verify-only mode: just compare row counts
    if (verifyOnly) {
      console.log('[Verify Only] Comparing row counts...');
      const results = await verifyMigration(source, target);
      printTable(results);

      const allMatch = results.every(r => r.match);
      if (allMatch) {
        console.log('All tables match!');
      } else {
        console.log('WARNING: Some tables have mismatched row counts');
      }

      await source.end();
      await target.end();
      return;
    }

    // Get a client for transaction
    const client = await target.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Step 3: Create schema
      console.log('[3/6] Creating schema...');
      await createSchema(client);

      // Dry-run mode: rollback after schema creation
      if (dryRun) {
        console.log('[Dry Run] Schema created successfully. Rolling back...');
        await client.query('ROLLBACK');
        console.log('Rollback complete. No changes were made.');
        await source.end();
        await target.end();
        return;
      }

      // Step 4: Migrate data
      console.log('[4/6] Migrating data...');
      console.log('  (Inserting in FK dependency order)');

      let totalRows = 0;
      for (const table of TABLES) {
        const count = await migrateTable(source, client, table);
        totalRows += count;
      }

      // Step 5: Reset sequences
      console.log('[5/6] Resetting sequences...');
      for (const table of TABLES) {
        if (table.hasSerial) {
          await resetSequence(client, table.name);
        }
      }
      console.log('  Sequences reset');

      // Commit transaction
      await client.query('COMMIT');
      console.log('  Transaction committed');

      // Step 6: Verify migration
      console.log('[6/6] Verifying migration...');
      const results = await verifyMigration(source, target);
      printTable(results);

      const allMatch = results.every(r => r.match);
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (allMatch) {
        console.log('Migration completed successfully!');
        console.log(`Total rows migrated: ${totalRows}`);
        console.log(`Total time: ${elapsed} seconds`);
      } else {
        console.error('WARNING: Row count mismatch detected!');
        if (skipErrors && failedRows.length > 0) {
          console.log(`${failedRows.length} rows failed. See migration-errors.json`);
          writeFileSync('migration-errors.json', JSON.stringify(failedRows, null, 2));
        }
      }

    } catch (error) {
      console.error('Error during migration, rolling back...');
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Cleanup connections
    await source.end();
    await target.end();

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
