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

interface ProcessingStats {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  startTime: number;
  lastRateLimit: number;
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

async function logSessionSummary(stats: ProcessingStats): Promise<void> {
  const endTime = Date.now();
  const duration = (endTime - stats.startTime) / 1000 / 60; // in minutes
  const successRate = ((stats.successCount / stats.totalProcessed) * 100).toFixed(1);

  const summary = [
    "\n=== Session Summary ===",
    `Total Artists Processed: ${stats.totalProcessed}`,
    `Successful Updates: ${stats.successCount}`,
    `Failed Updates: ${stats.errorCount}`,
    `Success Rate: ${successRate}%`,
    `Total Duration: ${duration.toFixed(1)} minutes`,
    `Rate Limits Hit: ${stats.lastRateLimit}`,
    "===================\n"
  ].join("\n");

  await logProgress(summary);
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

    // Log rate limit info if available
    const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
    if (rateLimitRemaining) {
      await logProgress(`Rate limit remaining: ${rateLimitRemaining}`);
    }

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

  const stats: ProcessingStats = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    startTime: Date.now(),
    lastRateLimit: 0
  };

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

      const progress = ((stats.totalProcessed / totalArtists) * 100).toFixed(2);
      const timeElapsed = (Date.now() - stats.startTime) / 1000;
      const avgTimePerArtist = timeElapsed / (stats.totalProcessed || 1);
      const estimatedTimeRemaining = ((totalArtists - stats.totalProcessed) * avgTimePerArtist) / 60;

      const progressMessage = [
        `Progress: ${progress}% (${stats.totalProcessed}/${totalArtists})`,
        `Success rate: ${((stats.successCount/stats.totalProcessed)*100 || 0).toFixed(1)}%`,
        `Time elapsed: ${(timeElapsed/60).toFixed(1)} minutes`,
        `Estimated remaining: ${estimatedTimeRemaining.toFixed(1)} minutes`,
        `Rate limits hit: ${stats.lastRateLimit}`,
        `Processing: ${artist.name}`
      ].join('\n');

      await logProgress(progressMessage);

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

          stats.successCount++;
        } else {
          stats.errorCount++;
        }

        await saveCheckpoint(artist.id);
        stats.totalProcessed++;

        // Add delay between requests
        const waitTime = BASE_DELAY_MS + Math.random() * JITTER_MS;
        await logProgress(`Waiting ${waitTime/1000} seconds before next request...`);
        await delay(waitTime);
      } catch (error) {
        stats.errorCount++;
        await logError(artist.name, error);
        // Continue with next artist after error
      }
    }

    await logSessionSummary(stats);
    await logProgress(
      `Completed processing. Success: ${stats.successCount}/${stats.totalProcessed} artists`
    );
    return stats.successCount;
  } catch (error) {
    await logError("SCRIPT", error);
    return stats.totalProcessed;
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