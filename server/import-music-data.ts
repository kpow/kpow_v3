import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { artists, songs, plays } from '../db/schema';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

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

async function importData() {
  const csvPath = path.join(__dirname, '../client/src/data/kpow-apple-music-plays-with-images.csv');
  const records: MusicPlay[] = [];

  // Read CSV file
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

  // Import artists first (unique)
  const uniqueArtists = new Map<string, number>();
  for (const record of records) {
    if (!uniqueArtists.has(record["Artist Name"])) {
      const [artist] = await db.insert(artists)
        .values({
          name: record["Artist Name"],
          imageUrl: record["Artist Image"] || null,
        })
        .returning();
      uniqueArtists.set(record["Artist Name"], artist.id);
    }
  }

  console.log(`Imported ${uniqueArtists.size} unique artists`);

  // Import songs (unique by name + artist)
  const uniqueSongs = new Map<string, number>();
  for (const record of records) {
    const songKey = `${record["Song Name"]}-${record["Artist Name"]}`;
    if (!uniqueSongs.has(songKey)) {
      const [song] = await db.insert(songs)
        .values({
          name: record["Song Name"],
          albumName: record["Album Name"],
          containerAlbumName: record["Container Album Name"],
          containerType: record["Container Type"],
          mediaDurationMs: parseInt(record["Media Duration In Milliseconds"]) || null,
          artistId: uniqueArtists.get(record["Artist Name"])!,
        })
        .returning();
      uniqueSongs.set(songKey, song.id);
    }
  }

  console.log(`Imported ${uniqueSongs.size} unique songs`);

  // Import play events
  let playCount = 0;
  for (const record of records) {
    const songKey = `${record["Song Name"]}-${record["Artist Name"]}`;
    await db.insert(plays)
      .values({
        songId: uniqueSongs.get(songKey)!,
        startTimestamp: new Date(record["Event Start Timestamp"]),
        endTimestamp: new Date(record["Event End Timestamp"]),
        playDurationMs: parseInt(record["Play Duration Milliseconds"]),
        endPositionMs: parseInt(record["End Position In Milliseconds"]) || null,
        endReasonType: record["End Reason Type"],
        featureName: record["Feature Name"],
        eventType: record["Event Type"],
      });
    playCount++;
  }

  console.log(`Imported ${playCount} play events`);

  await pool.end();
}

importData().catch(console.error);