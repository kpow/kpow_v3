import { db } from "../db";
import { artists } from "../db/schema";
import { isNull } from "drizzle-orm";
import fs from "fs/promises";

const OUTPUT_FILE = "artists_without_images.json";

async function getArtistsWithoutImages() {
  const artistsToUpdate = await db.query.artists.findMany({
    where: isNull(artists.imageUrl),
    orderBy: (artists, { asc }) => [asc(artists.id)]
  });

  const artistList = artistsToUpdate.map(artist => ({
    id: artist.id,
    name: artist.name
  }));

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(artistList, null, 2));
  
  console.log(`Found ${artistList.length} artists without images`);
  console.log(`Saved to ${OUTPUT_FILE}`);
  
  return artistList.length;
}

// Run the script
getArtistsWithoutImages()
  .then(count => {
    console.log(`Successfully saved ${count} artists to file`);
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });
