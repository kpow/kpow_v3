import { db } from "../../db";
import { artists } from "../../db/schema";
import { eq, not, inArray } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface LastFmArtist {
  name: string;
  mbid: string;
  url: string;
  image: Array<{
    "#text": string;
    size: "small" | "medium" | "large" | "extralarge" | "mega";
  }>;
  stats: {
    listeners: string;
    playcount: string;
  };
  bio: {
    summary: string;
    content: string;
  };
}

interface LastFmResponse {
  artist: LastFmArtist;
}

interface ProgressCache {
  processedArtists: string[];
  lastProcessedDate: string;
}

const CACHE_FILE = path.join(__dirname, "lastfm-progress.json");
const RATE_LIMIT_DELAY = 250; // 250ms between requests
const TEST_MODE = process.argv.includes("--test-mode");

async function loadProgress(): Promise<ProgressCache> {
  try {
    const data = await fs.promises.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { processedArtists: [], lastProcessedDate: new Date().toISOString() };
  }
}

async function saveProgress(cache: ProgressCache) {
  await fs.promises.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function getLastFmArtistInfo(artistName: string): Promise<LastFmResponse> {
  const API_KEY = process.env.LASTFM_API_KEY;
  if (!API_KEY) throw new Error("LASTFM_API_KEY not found in environment");

  const url = "http://ws.audioscrobbler.com/2.0/";
  const params = new URLSearchParams({
    method: "artist.getinfo",
    artist: artistName,
    api_key: API_KEY,
    format: "json"
  });

  const response = await axios.get(`${url}?${params}`);
  return response.data;
}

async function enrichArtist(artistName: string): Promise<void> {
  try {
    console.log(`Fetching data for artist: ${artistName}`);
    const data = await getLastFmArtistInfo(artistName);
    const { artist } = data;

    // Transform image data into a structured object
    const images = artist.image.reduce<{
      small: string;
      medium: string;
      large: string;
      extralarge: string;
      mega: string;
    }>((acc, img) => ({
      ...acc,
      [img.size]: img["#text"]
    }), {
      small: "",
      medium: "",
      large: "",
      extralarge: "",
      mega: ""
    });

    // Update database
    await db.update(artists)
      .set({
        imageUrl: images.large || images.extralarge || images.mega || "",
        images,
        bio: artist.bio.summary,
        lastfmUrl: artist.url,
        mbid: artist.mbid,
        listeners: parseInt(artist.stats.listeners),
        playcount: parseInt(artist.stats.playcount),
        lastUpdated: new Date()
      })
      .where(eq(artists.name, artistName));

    console.log(`✅ Updated artist: ${artistName}`);
  } catch (error) {
    console.error(`❌ Error updating artist ${artistName}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🔄 Starting Last.fm artist data enrichment process");
  console.log(TEST_MODE ? "🧪 Running in test mode" : "🚀 Running in full mode");

  const progress = await loadProgress();

  // Get artists from database
  const allArtists = await db.select({ name: artists.name })
    .from(artists)
    .where(
      // Only process artists not in our progress cache
      not(inArray(artists.name, progress.processedArtists))
    )
    .limit(TEST_MODE ? 5 : undefined); // Limit to 5 artists in test mode

  console.log(`📝 Found ${allArtists.length} artists to process`);

  // Process artists with rate limiting
  for (const artist of allArtists) {
    try {
      await enrichArtist(artist.name);
      progress.processedArtists.push(artist.name);
      await saveProgress(progress);

      console.log(`⏳ Waiting ${RATE_LIMIT_DELAY}ms before next request...`);
      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`❌ Failed to process ${artist.name}:`, error);
      // Save progress even if we encounter an error
      await saveProgress(progress);
      // Continue with next artist
      continue;
    }
  }

  console.log("✨ Finished processing artists");
}

// Run the script
main().catch(console.error);