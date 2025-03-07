import { db } from "../db";
import { artists } from "../db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const CHECKPOINT_FILE = "artist_image_checkpoint.json";
const ERROR_LOG_FILE = "artist_image_errors.log";

// More conservative rate limiting settings
const BASE_DELAY_MS = 1000; // 1 second between requests
const MAX_DELAY_MS = 60000; // Maximum backoff of 1 minute
const JITTER_MS = 300; // Add random jitter to prevent synchronized requests

interface Artist {
  id: number;
  name: string;
  albumName: string | null;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Exponential backoff with jitter
function getBackoffDelay(retryCount: number): number {
  const exponentialDelay = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS * Math.pow(2, retryCount),
  );
  const jitter = Math.random() * JITTER_MS;
  return exponentialDelay + jitter;
}

async function logError(artistName: string, error: any): Promise<void> {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - Artist: ${artistName} - Error: ${error}\n`;
  await fs.appendFile(ERROR_LOG_FILE, errorMessage);
}

async function saveCheckpoint(lastProcessedId: number): Promise<void> {
  await fs.writeFile(
    CHECKPOINT_FILE,
    JSON.stringify({ lastId: lastProcessedId }),
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

// Clean search term
const cleanSearchTerm = (term: string): string => {
  return term.replace(/["\[\]{}]/g, '').trim();
};

async function getArtistImage(
  artist: Artist,
  retryCount = 0,
): Promise<string | null> {
  try {
    // Only use album name for search if available
    if (!artist.albumName) {
      console.log(`No album name available for artist: "${artist.name}"`);
      return null;
    }

    const searchTerm = cleanSearchTerm(artist.albumName);
    console.log(`Searching for album: "${searchTerm}" by artist: "${artist.name}"`);

    // Create the URL for logging purposes
    const params = new URLSearchParams({
      term: searchTerm,
      entity: "album",
      limit: "5",
    });
    const fullUrl = `https://itunes.apple.com/search?${params.toString()}`;
    console.log(`Querying iTunes API with URL: ${fullUrl}`);

    const response = await axios.get(
      "https://itunes.apple.com/search",
      {
        params: {
          term: searchTerm,
          entity: "album",
          limit: 5,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    );

    if (response.data.resultCount > 0) {
      console.log(`Found ${response.data.resultCount} results for album: "${searchTerm}"`);

      // Find the first result that matches our artist name (case insensitive)
      const match = response.data.results.find(
        (result) => {
          const matchFound = result.artistName.toLowerCase() === artist.name.toLowerCase();
          if (matchFound) {
            console.log(`Found matching artist: "${result.artistName}" for album: "${result.collectionName}"`);
          }
          return matchFound;
        }
      );

      if (match?.artworkUrl100) {
        const imageUrl = match.artworkUrl100.replace("100x100bb", "300x300bb");
        console.log(`Found artwork URL: ${imageUrl}`);
        return imageUrl;
      }

      console.log(`No matching artist found in results for: ${artist.name}`);
      // Log all artists found to help debug
      console.log('Artists found:', response.data.results.map(r => r.artistName).join(', '));
      return null;
    }

    console.log(`No results found for album: "${searchTerm}"`);
    return null;
  } catch (error: any) {
    // Handle rate limiting (403 or 429 status codes)
    if (error.response?.status === 403 || error.response?.status === 429) {
      console.log(
        "---------------------------Rate limit exceeded. Retrying...-----------------------------------",
      );
      if (retryCount >= 5) {
        await logError(
          artist.name,
          `Max retries reached. Status: ${error.response?.status}`,
        );
        return null;
      }

      // Calculate backoff time
      const backoffDelay = getBackoffDelay(retryCount);
      console.log(
        `Rate limit hit for "${artist.name}". Waiting ${backoffDelay / 1000}s before retry ${retryCount + 1}/5`,
      );

      // Wait and then retry
      await delay(backoffDelay);
      return getArtistImage(artist, retryCount + 1);
    }

    // Log other errors
    await logError(artist.name, error);
    return null;
  }
}

async function enrichArtistImages(): Promise<number> {
  // Track if we're in the process of shutting down
  let isShuttingDown = false;
  process.on("SIGINT", () => {
    console.log("\nGraceful shutdown initiated...");
    isShuttingDown = true;
  });

  const lastProcessedId = await loadCheckpoint();
  console.log(`Starting from artist ID: ${lastProcessedId}`);
  let processedCount = 0;

  try {
    // Read the list of artists without images
    const artistsData = await fs.readFile(
      "artists_without_images.json",
      "utf-8",
    );
    const artists_list: Artist[] = JSON.parse(artistsData);

    // Filter artists based on checkpoint
    const remainingArtists = artists_list.filter(
      (artist) => artist.id > lastProcessedId,
    );

    console.log(`Found ${remainingArtists.length} artists to process`);

    for (const artist of remainingArtists) {
      if (isShuttingDown) {
        console.log("Shutting down gracefully...");
        break;
      }

      try {
        console.log(`Processing artist: ${artist.name}${artist.albumName ? ` (Album: ${artist.albumName})` : ''}`);

        const imageUrl = await getArtistImage(artist);
        if (imageUrl) {
          await db
            .update(artists)
            .set({
              imageUrl: imageUrl,
              lastUpdated: new Date(),
            })
            .where(eq(artists.id, artist.id));

          console.log(`Updated image for: ${artist.name}`);
          processedCount++;
        } else {
          console.log(`No image found for: ${artist.name}`);
        }

        await saveCheckpoint(artist.id);

        // Add delay between requests to avoid rate limiting
        const waitTime = BASE_DELAY_MS + Math.random() * JITTER_MS;
        console.log(
          `Waiting ${waitTime / 1000} seconds before next request...`,
        );
        await delay(waitTime);
      } catch (error) {
        await logError(artist.name, error);
        console.error(`Error processing ${artist.name}:`, error);

        // Wait longer after an error
        await delay(BASE_DELAY_MS * 2);
      }
    }
  } catch (error) {
    console.error("Failed to read artists list:", error);
    return processedCount;
  }

  return processedCount;
}

// Run the script
enrichArtistImages()
  .then((count) => {
    console.log(`Processed ${count} artists`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });