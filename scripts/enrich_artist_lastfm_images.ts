import { db } from "../db";
import { artists } from "../db/schema";
import { eq, isNull } from "drizzle-orm";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const CHECKPOINT_FILE = "lastfm_artist_image_checkpoint.json";
const ERROR_LOG_FILE = "lastfm_artist_image_errors.log";
const PROGRESS_LOG_FILE = "lastfm_artist_image_progress.log";

// Rate limiting settings
const BASE_DELAY_MS = 2000; // 2 seconds between requests
const MAX_DELAY_MS = 60000; // Maximum backoff of 1 minute
const JITTER_MS = 500; // Add random jitter

interface Artist {
  id: number;
  name: string;
  artistImageUrl: string | null;
}

interface LastFmImage {
  size: string;
  "#text": string;
}

// Helper functions for delay and backoff
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(retryCount: number): number {
  const exponentialDelay = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS * Math.pow(2, retryCount)
  );
  const jitter = Math.random() * JITTER_MS;
  return exponentialDelay + jitter;
}

// Logging functions
async function logError(artistName: string, error: any): Promise<void> {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - Artist: ${artistName} - Error: ${error}\n`;
  await fs.appendFile(ERROR_LOG_FILE, errorMessage);
}

async function logProgress(message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  await fs.appendFile(PROGRESS_LOG_FILE, logMessage);
  console.log(message); // Also log to console
}

// Checkpoint management
async function saveCheckpoint(lastProcessedId: number): Promise<void> {
  await fs.writeFile(
    CHECKPOINT_FILE,
    JSON.stringify({ lastId: lastProcessedId, timestamp: new Date().toISOString() })
  );
}

async function loadCheckpoint(): Promise<number> {
  try {
    const data = await fs.readFile(CHECKPOINT_FILE, "utf-8");
    return JSON.parse(data).lastId;
  } catch {
    return 0;
  }
}

// Get artist image from Last.fm
async function getArtistImage(
  artist: Artist,
  apiKey: string,
  retryCount = 0
): Promise<string | null> {
  try {
    const artistName = encodeURIComponent(artist.name);
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artistName}&api_key=${apiKey}&format=json`;
    
    const response = await axios.get(url);
    const images: LastFmImage[] = response.data?.artist?.image || [];
    
    // Get the largest image available (typically the last one)
    const largestImage = images
      .reverse()
      .find(img => img["#text"] && !img["#text"].includes("default"));
    
    if (largestImage?.["#text"]) {
      await logProgress(`Found image for artist: ${artist.name}`);
      return largestImage["#text"];
    }
    
    await logProgress(`No image found for artist: ${artist.name}`);
    return null;
  } catch (error: any) {
    if (error.response?.status === 429) {
      if (retryCount >= 5) {
        await logError(artist.name, `Max retries reached. Status: 429`);
        return null;
      }
      
      const backoffDelay = getBackoffDelay(retryCount);
      await logProgress(
        `Rate limit hit for "${artist.name}". Waiting ${backoffDelay/1000}s before retry ${retryCount + 1}/5`
      );
      
      await delay(backoffDelay);
      return getArtistImage(artist, apiKey, retryCount + 1);
    }
    
    await logError(artist.name, error);
    return null;
  }
}

// Main enrichment function
async function enrichArtistImages(apiKey: string): Promise<number> {
  let isShuttingDown = false;
  process.on("SIGINT", () => {
    console.log("\nGraceful shutdown initiated...");
    isShuttingDown = true;
  });

  const lastProcessedId = await loadCheckpoint();
  await logProgress(`Starting from artist ID: ${lastProcessedId}`);
  
  let processedCount = 0;
  let successCount = 0;

  try {
    // Get all artists without artist images
    const artistsToUpdate = await db.query.artists.findMany({
      where: isNull(artists.artistImageUrl),
      orderBy: (artists, { asc }) => [asc(artists.id)]
    });

    const totalArtists = artistsToUpdate.length;
    await logProgress(`Found ${totalArtists} artists to process`);

    for (const artist of artistsToUpdate) {
      if (isShuttingDown) {
        await logProgress("Shutting down gracefully...");
        break;
      }

      if (artist.id <= lastProcessedId) {
        continue;
      }

      const progress = ((processedCount / totalArtists) * 100).toFixed(2);
      await logProgress(
        `Progress: ${progress}% (${processedCount}/${totalArtists}) - Processing: ${artist.name}`
      );

      try {
        const imageUrl = await getArtistImage(artist, apiKey);
        if (imageUrl) {
          await db
            .update(artists)
            .set({
              artistImageUrl: imageUrl,
              lastUpdated: new Date()
            })
            .where(eq(artists.id, artist.id));
          
          successCount++;
        }

        await saveCheckpoint(artist.id);
        processedCount++;

        // Add delay between requests
        const waitTime = BASE_DELAY_MS + Math.random() * JITTER_MS;
        await logProgress(`Waiting ${waitTime/1000} seconds before next request...`);
        await delay(waitTime);
      } catch (error) {
        await logError(artist.name, error);
        // Continue with next artist after error
      }
    }

    await logProgress(
      `Completed processing. Success: ${successCount}/${processedCount} artists`
    );
    return successCount;
  } catch (error) {
    await logError("SCRIPT", error);
    return processedCount;
  }
}

// Check if Last.fm API key is available
if (!process.env.LASTFM_API_KEY) {
  console.error("Error: LASTFM_API_KEY environment variable is not set");
  process.exit(1);
}

// Run the script
enrichArtistImages(process.env.LASTFM_API_KEY)
  .then((count) => {
    console.log(`Successfully processed ${count} artists`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
