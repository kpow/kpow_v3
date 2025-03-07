
import { db } from "@db/index";
import { artists } from "@db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import { argv } from "process";

interface ArtistImage {
  key: string;
  url: string;
}

async function batchUpdateArtistImages() {
  try {
    if (argv.length < 3) {
      console.log("Usage: npx tsx server/scripts/batch-update-artist-images.ts path/to/image-file.json");
      process.exit(1);
    }

    const filePath = argv[2];
    console.log(`Loading artist images from ${filePath}`);

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const artistImages: ArtistImage[] = JSON.parse(fileContent);

    console.log(`Found ${artistImages.length} artist images to process`);
    
    let updated = 0;
    let notFound = 0;
    const notFoundArtists: string[] = [];

    // Process each artist image
    for (const artistImage of artistImages) {
      const result = await db
        .update(artists)
        .set({ imageUrl: artistImage.url })
        .where(eq(artists.name, artistImage.key))
        .returning({ id: artists.id });

      if (result.length > 0) {
        updated++;
      } else {
        notFound++;
        notFoundArtists.push(artistImage.key);
      }
    }

    console.log(`Update complete: ${updated} artists updated, ${notFound} artists not found`);
    
    if (notFound > 0) {
      console.log("Artists not found in database:");
      notFoundArtists.forEach(artist => console.log(`- ${artist}`));
    }
    
  } catch (error) {
    console.error("Error batch updating artist images:", error);
  }
}

batchUpdateArtistImages();
