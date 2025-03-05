import fs from "fs";
import path from "path";
import axios from "axios";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load the Last.fm API key from the environment variables
const API_KEY = process.env.LASTFM_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing Last.fm API Key. Please add it to your .env file.");
  process.exit(1);
}

// Test the API key with a single request
const testAPI = async () => {
  try {
    const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "track.getInfo",
        api_key: API_KEY,
        format: "json",
        track: "Yellow Submarine",
        artist: "The Beatles",
      },
    });
    console.log("API Test Response:", JSON.stringify(response.data, null, 2));
    if (!response.data?.track?.artist?.name) {
      console.error("❌ API test failed - unexpected response format");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ API test failed:", error.response?.data || error.message);
    process.exit(1);
  }
};

// Define file paths
const INPUT_FILE = path.join(__dirname, "kpow-apple-music-plays-trimmed.csv");
const OUTPUT_FILE = path.join(__dirname, "kpow-apple-music-plays-with-artists.csv");
const CACHE_FILE = path.join(__dirname, "artist-cache.json");

// Define the type for each CSV record
interface SongRecord {
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
  "Artist Name"?: string;
}

// Cache to store results for duplicate API requests
let songCache = new Map<string, string>();

// Clear any existing cache file
try {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
    console.log("🗑️  Cleared existing cache file");
  }
} catch (error) {
  console.warn("⚠️  Could not clear cache file:", error);
}

// Function to save cache to file
const saveCache = () => {
  const cacheObject = Object.fromEntries(songCache);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObject, null, 2));
  console.log(`💾 Saved ${songCache.size} entries to cache file`);
};

// Function to fetch the artist name from Last.fm API
const getArtistFromAPI = async (song: string, album: string | null): Promise<string> => {
  const cacheKey = `${song}-${album || "unknown"}`;
  if (songCache.has(cacheKey)) {
    return songCache.get(cacheKey)!;
  }

  try {
    const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "track.search",
        api_key: API_KEY,
        format: "json",
        track: song,
        limit: 1
      },
    });

    const artist = response.data?.results?.trackmatches?.track?.[0]?.artist;
    if (artist) {
      songCache.set(cacheKey, artist);
      return artist;
    }

    console.warn(`⚠️ No artist found for "${song}" (Album: ${album || 'N/A'})`);
    return "Unknown";
  } catch (error: any) {
    console.error(`⚠️ Error fetching artist for "${song}":`, error.response?.data || error.message);
    return "Unknown";
  }
};

// A simple delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to process the CSV
const processCSV = async () => {
  const records: SongRecord[] = [];

  // Read the CSV file
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(parse({ columns: true }))
      .on("data", (row: SongRecord) => records.push(row))
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error));
  });

  console.log(`📂 Loaded ${records.length} entries. Fetching artist names...`);

  try {
    // For each record, get the artist name with a delay between requests
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      record["Artist Name"] = await getArtistFromAPI(record["Song Name"], record["Album Name"]);
      console.log(`Progress: ${i + 1}/${records.length} (${Math.round(((i + 1) / records.length) * 100)}%)`);

      // Save cache every 100 records
      if ((i + 1) % 100 === 0) {
        saveCache();
      }

      await delay(100); // 100ms delay between each API call
    }

    // Final cache save
    saveCache();

    // Write the updated records to a new CSV file
    const csvString = stringify(records, {
      header: true,
      columns: [
        "Song Name",
        "Album Name",
        "Container Album Name",
        "Container Type",
        "End Position In Milliseconds",
        "End Reason Type",
        "Event End Timestamp",
        "Event Start Timestamp",
        "Event Type",
        "Feature Name",
        "Media Duration In Milliseconds",
        "Play Duration Milliseconds",
        "Artist Name"
      ]
    });

    fs.writeFileSync(OUTPUT_FILE, csvString);
    console.log(`✅ Updated CSV saved as ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("❌ An error occurred during processing:", error);
    // Save cache on error to preserve progress
    saveCache();
  }
};

// First test the API, then proceed with processing if successful
console.log("🧪 Testing Last.fm API connection...");
testAPI().then(() => {
  console.log("✅ API test successful, proceeding with data processing");
  processCSV().catch((error) => console.error("❌ An error occurred:", error));
});