import fs from "fs";
import axios from "axios";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import dotenv from "dotenv";

dotenv.config();

// Load the Last.fm API key from the environment variables.
const API_KEY = process.env.LASTFM_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing Last.fm API Key. Please add it to your .env file.");
  process.exit(1);
}

// Define file paths.
const INPUT_FILE = "song_plays.csv";
const OUTPUT_FILE = "updated_song_plays.csv";

// Define the type for each CSV record.
interface SongRecord {
  song_name: string;
  album_title: string;
  artist?: string;
}

// Cache to store results for duplicate API requests.
const songCache = new Map<string, string>();

// Function to fetch the artist name from Last.fm API.
const getArtistFromAPI = async (song: string, album: string | null): Promise<string> => {
  const cacheKey = `${song}-${album || "unknown"}`;
  if (songCache.has(cacheKey)) {
    return songCache.get(cacheKey)!;
  }

  try {
    const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "track.getInfo",
        api_key: API_KEY,
        format: "json",
        track: song,
        album: album || "", // Some records might have no album.
      },
    });

    const artist = response.data?.track?.artist?.name || "Unknown";
    songCache.set(cacheKey, artist);
    return artist;
  } catch (error: any) {
    console.error(`⚠️ Error fetching artist for "${song}": ${error.message}`);
    return "Unknown";
  }
};

// A simple delay function.
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to process the CSV: read, update, and write.
const processCSV = async () => {
  const records: SongRecord[] = [];

  // Read the CSV file.
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csv())
      .on("data", (row: SongRecord) => records.push(row))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📂 Loaded ${records.length} entries. Fetching artist names...`);

  // For each record, get the artist name with a delay between requests.
  for (const record of records) {
    record.artist = await getArtistFromAPI(record.song_name, record.album_title || null);
    await delay(200); // 200ms delay between each API call; adjust as needed.
  }

  // Write the updated records to a new CSV file.
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
        // this needs to get added to the all the fields in the the source csv file.
      { id: "artist", title: "Artist Name" },
    ],
  });

  await csvWriter.writeRecords(records);
  console.log(`✅ Updated CSV saved as ${OUTPUT_FILE}`);
};

// Run the process.
processCSV().catch((error) => console.error("❌ An error occurred:", error));
