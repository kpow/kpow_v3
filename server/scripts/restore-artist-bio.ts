import { db } from "@db/index";
import { artists } from "@db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface LastFmArtist {
  name: string;
  bio: {
    summary: string;
    content: string;
  };
}

interface LastFmResponse {
  artist: LastFmArtist;
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

async function restoreArtistBio() {
  try {
    console.log("Starting bio restoration...");

    // Get all artists without bio
    const artistsToUpdate = await db
      .select({ id: artists.id, name: artists.name })
      .from(artists)
      .where(eq(artists.bio, null));

    console.log(`Found ${artistsToUpdate.length} artists needing bio restoration`);

    let restored = 0;
    let failed = 0;

    for (const artist of artistsToUpdate) {
      try {
        console.log(`Processing ${artist.name} (${restored + failed + 1}/${artistsToUpdate.length})`);
        
        const data = await getLastFmArtistInfo(artist.name);
        
        if (data.artist?.bio) {
          await db
            .update(artists)
            .set({
              bio: data.artist.bio.content || data.artist.bio.summary
            })
            .where(eq(artists.id, artist.id));
          
          restored++;
          console.log(`✓ Restored bio for ${artist.name}`);
        } else {
          failed++;
          console.log(`✗ No bio found for ${artist.name}`);
        }

        // Rate limiting
        await delay(250); // 250ms between requests
      } catch (error) {
        failed++;
        console.error(`Error processing ${artist.name}:`, error);
        continue;
      }
    }

    console.log("\nRestoration complete:");
    console.log(`- Successfully restored: ${restored} artists`);
    console.log(`- Failed to restore: ${failed} artists`);

  } catch (error) {
    console.error("Error during bio restoration:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the script
restoreArtistBio()
  .then(() => {
    console.log("Bio restoration process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error in restoration script:", error);
    process.exit(1);
  });
