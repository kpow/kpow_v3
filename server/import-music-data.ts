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

async function importData() {
  const csvPath = path.join(__dirname, '../client/src/data/kpow-apple-music-plays-with-images.csv');

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

  // Pre-process to get unique artists and songs
  console.log('Pre-processing data...');
  const uniqueArtistsMap = new Map<string, { name: string, image: string | null }>();
  const uniqueSongsSet = new Set<string>();

  for (const record of records) {
    uniqueArtistsMap.set(record["Artist Name"], {
      name: record["Artist Name"],
      image: record["Artist Image"] || null
    });
    uniqueSongsSet.add(`${record["Song Name"]}-${record["Artist Name"]}`);
  }

  console.log(`Found ${uniqueArtistsMap.size} unique artists and ${uniqueSongsSet.size} unique songs`);

  // Connect to PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Import artists
    console.log('Importing artists...');
    const uniqueArtists = new Map<string, number>();
    const artistBatchSize = 50;
    const artists = Array.from(uniqueArtistsMap.values());

    for (let i = 0; i < artists.length; i += artistBatchSize) {
      const batch = artists.slice(i, i + artistBatchSize);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (const artist of batch) {
          const result = await client.query(
            `INSERT INTO artists (name, image_url) 
             VALUES ($1, $2) 
             ON CONFLICT (name) DO UPDATE 
             SET image_url = EXCLUDED.image_url
             RETURNING id, name`,
            [artist.name, artist.image]
          );
          uniqueArtists.set(result.rows[0].name, result.rows[0].id);
        }

        await client.query('COMMIT');
        console.log(`Processed ${i + batch.length} artists of ${artists.length}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error processing artist batch starting at ${i}:`, error);
      } finally {
        client.release();
      }
    }

    // Import songs
    console.log('Importing songs...');
    const uniqueSongs = new Map<string, number>();
    const songBatchSize = 50;

    for (let i = 0; i < records.length; i += songBatchSize) {
      const batch = records.slice(i, i + songBatchSize);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (const record of batch) {
          const songKey = `${record["Song Name"]}-${record["Artist Name"]}`;
          if (!uniqueSongs.has(songKey)) {
            try {
              const result = await client.query(
                `INSERT INTO songs (name, album_name, container_album_name, container_type, media_duration_ms, artist_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT ON CONSTRAINT songs_name_artist_id_unique 
                 DO UPDATE SET
                   album_name = EXCLUDED.album_name,
                   container_album_name = EXCLUDED.container_album_name,
                   container_type = EXCLUDED.container_type,
                   media_duration_ms = EXCLUDED.media_duration_ms
                 RETURNING id`,
                [
                  record["Song Name"],
                  record["Album Name"],
                  record["Container Album Name"],
                  record["Container Type"],
                  parseInt(record["Media Duration In Milliseconds"]) || null,
                  uniqueArtists.get(record["Artist Name"])!,
                ]
              );
              uniqueSongs.set(songKey, result.rows[0].id);
            } catch (error) {
              console.error(`Error importing song ${songKey}:`, error);
            }
          }
        }

        await client.query('COMMIT');
        console.log(`Processed ${i + batch.length} songs of ${records.length}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error processing song batch starting at ${i}:`, error);
      } finally {
        client.release();
      }
    }

    // Import play events
    console.log('Importing play events...');
    let playCount = 0;
    let skippedCount = 0;
    const playBatchSize = 50;

    for (let i = 0; i < records.length; i += playBatchSize) {
      const batch = records.slice(i, i + playBatchSize);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (const record of batch) {
          const songKey = `${record["Song Name"]}-${record["Artist Name"]}`;
          const songId = uniqueSongs.get(songKey);

          if (!songId) {
            skippedCount++;
            continue;
          }

          if (!isValidDate(record["Event Start Timestamp"]) || 
              !isValidDate(record["Event End Timestamp"])) {
            skippedCount++;
            continue;
          }

          const playDuration = parseInt(record["Play Duration Milliseconds"]);
          if (isNaN(playDuration) || playDuration <= 0) {
            skippedCount++;
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
          } catch (error) {
            console.error(`Error importing play for ${songKey}:`, error);
            skippedCount++;
          }
        }

        await client.query('COMMIT');
        console.log(`Processed ${i + batch.length} plays of ${records.length} (${playCount} imported, ${skippedCount} skipped)`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error processing plays batch starting at ${i}:`, error);
      } finally {
        client.release();
      }
    }

    console.log(`
Import complete:
- ${uniqueArtists.size} unique artists imported
- ${uniqueSongs.size} unique songs imported
- ${playCount} play events imported
- ${skippedCount} play events skipped
    `);

  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

importData().catch(console.error);