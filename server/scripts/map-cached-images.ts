import { db } from "@db/index";
import { artists } from "@db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ArtistImage {
  key: string;
  url: string;
}

async function mapCachedImages() {
  try {
    const cachePath = path.join(__dirname, '../../client/src/data/ArtistImagesCache.js');
    console.log(`Reading cache from: ${cachePath}`);

    // Import the cache file dynamically
    const cacheModule = await import(`file://${cachePath}`);
    const artistImages: ArtistImage[] = cacheModule.default;

    console.log(`Found ${artistImages.length} cached artist images`);

    // Get all artists from database
    const dbArtists = await db.select({
      id: artists.id,
      name: artists.name,
      imageUrl: artists.imageUrl
    }).from(artists);

    console.log(`Found ${dbArtists.length} artists in database`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const missingImages: string[] = [];
    const notFoundArtists: string[] = [];

    // Process each artist image
    for (const artistImage of artistImages) {
      const matchingArtist = dbArtists.find(
        a => a.name.toLowerCase() === artistImage.key.toLowerCase()
      );

      if (matchingArtist) {
        if (!matchingArtist.imageUrl) {
          // Update artist with cached image
          await db.update(artists)
            .set({ imageUrl: artistImage.url })
            .where(eq(artists.name, matchingArtist.name));
          updated++;
        } else {
          skipped++;
        }
      } else {
        notFound++;
        notFoundArtists.push(artistImage.key);
      }
    }

    // Find artists without images
    for (const dbArtist of dbArtists) {
      if (!dbArtist.imageUrl) {
        missingImages.push(dbArtist.name);
      }
    }

    // Output results
    console.log("\nMapping Results:");
    console.log(`- Updated: ${updated} artists`);
    console.log(`- Skipped (already had image): ${skipped} artists`);
    console.log(`- Not found in DB: ${notFound} artists`);

    if (notFoundArtists.length > 0) {
      console.log("\nArtists from cache not found in database:");
      notFoundArtists.forEach(name => console.log(`- ${name}`));
    }

    if (missingImages.length > 0) {
      console.log("\nArtists still missing images:");
      missingImages.forEach(name => console.log(`- ${name}`));

      // Save missing artists to file for later processing
      const missingArtistsPath = path.join(__dirname, '../../client/src/data/missingArtistImages.json');
      fs.writeFileSync(missingArtistsPath, JSON.stringify(missingImages, null, 2));
      console.log(`\nSaved ${missingImages.length} artists missing images to: ${missingArtistsPath}`);
    }

  } catch (error) {
    console.error("Error mapping cached images:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the script
mapCachedImages();