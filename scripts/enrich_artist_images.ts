import { db } from "../db";
import { artists } from "../db/schema";
import { eq, isNull } from "drizzle-orm";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const CHECKPOINT_FILE = "artist_image_checkpoint.json";
const DELAY_MS = 250;
const ERROR_LOG_FILE = "artist_image_errors.log";

interface ItunesResponse {
  resultCount: number;
  results: Array<{
    artistName: string;
    artworkUrl100?: string;
  }>;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logError(artistName: string, error: any) {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - Artist: ${artistName} - Error: ${error}\n`;
  await fs.appendFile(ERROR_LOG_FILE, errorMessage);
}

async function saveCheckpoint(lastProcessedId: number) {
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify({ lastId: lastProcessedId }));
}

async function loadCheckpoint(): Promise<number> {
  try {
    const data = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
    return JSON.parse(data).lastId;
  } catch {
    return 0;
  }
}

async function getArtistImage(artistName: string): Promise<string | null> {
  try {
    const response = await axios.get<ItunesResponse>('https://itunes.apple.com/search', {
      params: {
        term: artistName,
        entity: 'album',
        limit: 5
      }
    });

    if (response.data.resultCount > 0) {
      // Find the first result that matches our artist name (case insensitive)
      const match = response.data.results.find(
        result => result.artistName.toLowerCase() === artistName.toLowerCase()
      );
      return match?.artworkUrl100 || null;
    }
    return null;
  } catch (error) {
    await logError(artistName, error);
    return null;
  }
}

async function enrichArtistImages(batchSize: number = 10) {
  const lastProcessedId = await loadCheckpoint();
  console.log(`Starting from artist ID: ${lastProcessedId}`);

  const artistsToUpdate = await db.query.artists.findMany({
    where: isNull(artists.imageUrl),
    limit: batchSize
  });

  for (const artist of artistsToUpdate) {
    try {
      console.log(`Processing artist: ${artist.name}`);

      const imageUrl = await getArtistImage(artist.name);
      if (imageUrl) {
        await db
          .update(artists)
          .set({ 
            imageUrl: imageUrl,
            lastUpdated: new Date()
          })
          .where(eq(artists.id, artist.id));

        console.log(`Updated image for: ${artist.name}`);
      } else {
        console.log(`No image found for: ${artist.name}`);
      }

      await saveCheckpoint(artist.id);
      await delay(DELAY_MS);
    } catch (error) {
      await logError(artist.name, error);
      console.error(`Error processing ${artist.name}:`, error);
    }
  }

  return artistsToUpdate.length;
}

// Run the script
enrichArtistImages(5)
  .then(count => {
    console.log(`Processed ${count} artists`);
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });