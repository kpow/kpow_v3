
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

interface ItunesResponse {
  resultCount: number;
  results: Array<{
    artistName: string;
    artworkUrl100?: string;
  }>;
}

interface Artist {
  id: number;
  name: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponential backoff with jitter
function getBackoffDelay(retryCount: number): number {
  const exponentialDelay = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS * Math.pow(2, retryCount)
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

async function getArtistImage(artistName: string, retryCount = 0): Promise<string | null> {
  try {
    const response = await axios.get<ItunesResponse>('https://itunes.apple.com/search', {
      params: {
        term: artistName,
        entity: 'album',
        limit: 5
      },
      headers: {
        // Adding user agent to appear more like a browser
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.data.resultCount > 0) {
      // Find the first result that matches our artist name (case insensitive)
      const match = response.data.results.find(
        result => result.artistName.toLowerCase() === artistName.toLowerCase()
      );
      return match?.artworkUrl100 ? match.artworkUrl100.replace('100x100bb', '300x300bb') : null;
    }
    return null;
  } catch (error: any) {
    // Handle rate limiting (403 or 429 status codes)
    if (error.response?.status === 403 || error.response?.status === 429) {
      // If we've reached max retries, log and return null
      if (retryCount >= 5) {
        await logError(artistName, `Max retries reached. Status: ${error.response?.status}`);
        return null;
      }
      
      // Calculate backoff time
      const backoffDelay = getBackoffDelay(retryCount);
      console.log(`Rate limit hit for "${artistName}". Waiting ${backoffDelay/1000}s before retry ${retryCount + 1}/5`);
      
      // Wait and then retry
      await delay(backoffDelay);
      return getArtistImage(artistName, retryCount + 1);
    }
    
    // Log other errors
    await logError(artistName, error);
    return null;
  }
}

async function enrichArtistImages(): Promise<number> {
  // Track if we're in the process of shutting down
  let isShuttingDown = false;
  process.on('SIGINT', () => {
    console.log('\nGraceful shutdown initiated...');
    isShuttingDown = true;
  });

  const lastProcessedId = await loadCheckpoint();
  console.log(`Starting from artist ID: ${lastProcessedId}`);
  let processedCount = 0;

  try {
    // Read the list of artists without images
    const artistsData = await fs.readFile('artists_without_images.json', 'utf-8');
    const artists_list: Artist[] = JSON.parse(artistsData);

    // Filter artists based on checkpoint
    const remainingArtists = artists_list.filter(artist => artist.id > lastProcessedId);

    console.log(`Found ${remainingArtists.length} artists to process`);

    for (const artist of remainingArtists) {
      if (isShuttingDown) {
        console.log('Shutting down gracefully...');
        break;
      }

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
          processedCount++;
        } else {
          console.log(`No image found for: ${artist.name}`);
        }

        await saveCheckpoint(artist.id);
        
        // Add more delay between requests to avoid rate limiting
        const waitTime = BASE_DELAY_MS + Math.random() * JITTER_MS;
        console.log(`Waiting ${waitTime/1000} seconds before next request...`);
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
  .then(count => {
    console.log(`Processed ${count} artists`);
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });
