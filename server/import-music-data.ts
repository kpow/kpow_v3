import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MusicPlay {
  "Song Name": string;
  "Album Name": string;
  "Container Album Name": string;
  "Container Type": string;
  "End Position In Milliseconds": string;
  "End Reason Type": string;
  "Event End Timestamp": string;
  "Event Start Timestamp": string;
  "Event Type": string;
  "Feature Name": string;
  "Media Duration In Milliseconds": string;
  "Play Duration Milliseconds": string;
  "Artist Name": string;
  "Artist Image": string;
}

function isValidDate(dateStr: string): boolean {
  const timestamp = Date.parse(dateStr);
  return !isNaN(timestamp) && timestamp > 0;
}

async function getConnection(pool: pkg.Pool): Promise<pkg.PoolClient> {
  let retries = 3;
  while (retries > 0) {
    try {
      return await pool.connect();
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.log('Retrying database connection...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Failed to connect to database after retries');
}

async function importPlays() {
  const csvPath = path.join(__dirname, '../client/src/data/kpow-apple-music-plays-with-images.csv');
  const progressFile = path.join(__dirname, 'import-progress.json');

  // Read progress if exists
  let startIndex = 0;
  let totalPlayCount = 0;
  let totalSkippedCount = 0;
  if (fs.existsSync(progressFile)) {
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    startIndex = progress.lastProcessedIndex || 0;
    totalPlayCount = progress.totalPlayCount || 0;
    totalSkippedCount = progress.totalSkippedCount || 0;
    console.log(`Resuming from index ${startIndex} (${totalPlayCount} imported, ${totalSkippedCount} skipped)`);
  }

  console.log('Reading CSV file...');
  const records: MusicPlay[] = [];
  const parser = fs.createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );

  for await (const record of parser) {
    records.push(record);
  }

  console.log(`Read ${records.length} records from CSV`);

  // Connect to PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Limit to single connection for better stability
    connectionTimeoutMillis: 10000,
  });

  try {
    // Load existing song IDs first
    console.log('Loading existing song references...');
    const uniqueSongs = new Map<string, number>();

    const songResults = await pool.query(
      `SELECT s.id, s.name, a.name as artist_name 
       FROM songs s 
       JOIN artists a ON s.artist_id = a.id`
    );

    for (const row of songResults.rows) {
      const songKey = `${row.name}-${row.artist_name}`;
      uniqueSongs.set(songKey, row.id);
    }

    console.log(`Loaded ${uniqueSongs.size} existing songs`);

    // Import play events with smaller batches
    console.log('Importing play events...');
    let playCount = 0;
    let skippedCount = 0;
    const playBatchSize = 3; // Even smaller batch size

    for (let i = startIndex; i < records.length; i += playBatchSize) {
      const batch = records.slice(i, Math.min(i + playBatchSize, records.length));
      let client;

      try {
        client = await getConnection(pool);
        await client.query('BEGIN');

        for (const record of batch) {
          const songKey = `${record["Song Name"]}-${record["Artist Name"]}`;
          const songId = uniqueSongs.get(songKey);

          if (!songId) {
            skippedCount++;
            totalSkippedCount++;
            continue;
          }

          if (!isValidDate(record["Event Start Timestamp"]) || 
              !isValidDate(record["Event End Timestamp"])) {
            skippedCount++;
            totalSkippedCount++;
            continue;
          }

          const playDuration = parseInt(record["Play Duration Milliseconds"]);
          if (isNaN(playDuration) || playDuration <= 0) {
            skippedCount++;
            totalSkippedCount++;
            continue;
          }

          try {
            await client.query(
              `INSERT INTO plays (
                song_id, start_timestamp, end_timestamp, play_duration_ms,
                end_position_ms, end_reason_type, feature_name, event_type
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                songId,
                new Date(record["Event Start Timestamp"]),
                new Date(record["Event End Timestamp"]),
                playDuration,
                parseInt(record["End Position In Milliseconds"]) || null,
                record["End Reason Type"],
                record["Feature Name"],
                record["Event Type"],
              ]
            );
            playCount++;
            totalPlayCount++;
          } catch (error) {
            console.error(`Error importing play for ${songKey}:`, error);
            skippedCount++;
            totalSkippedCount++;
          }
        }

        await client.query('COMMIT');

        // Save progress
        fs.writeFileSync(progressFile, JSON.stringify({ 
          lastProcessedIndex: i + batch.length,
          totalPlayCount,
          totalSkippedCount,
          percentage: ((i + batch.length) / records.length * 100).toFixed(2)
        }, null, 2));

        console.log(`Progress: ${((i + batch.length) / records.length * 100).toFixed(2)}% (${totalPlayCount} imported, ${totalSkippedCount} skipped)`);
      } catch (error) {
        if (client) {
          try {
            await client.query('ROLLBACK');
          } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
          }
        }
        console.error(`Error processing batch starting at ${i}:`, error);

        // If we hit a connection error, wait longer before retrying
        if (error.code === '57P01') {
          console.log('Database connection interrupted, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } finally {
        if (client) {
          client.release();
        }
      }

      // Add a longer delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Clean up progress file when complete
    if (fs.existsSync(progressFile)) {
      fs.unlinkSync(progressFile);
    }

    console.log(`
Import complete:
- ${totalPlayCount} play events imported
- ${totalSkippedCount} play events skipped
    `);

  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

importPlays().catch(console.error);