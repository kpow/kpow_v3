import { db } from "../db";
import { artists, songs } from "../db/schema";
import { isNull, asc } from "drizzle-orm";
import fs from "fs/promises";

const OUTPUT_FILE = "./artists_without_images.json";

interface ArtistWithAlbum {
  id: number;
  name: string;
  albumName: string | null;
}

async function getArtistsWithoutImages() {
  // Get artists without images and their first album
  const artistsToUpdate = await db.query.artists.findMany({
    where: isNull(artists.imageUrl),
    with: {
      songs: {
        limit: 1,
      },
    },
    orderBy: [asc(artists.id)],
  });

  const artistList: ArtistWithAlbum[] = artistsToUpdate.map((artist) => ({
    id: artist.id,
    name: artist.name,
    albumName: artist.songs?.[0]?.albumName || null,
  }));

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(artistList, null, 2));

  console.log(`Found ${artistList.length} artists without images`);
  console.log(`Saved to ${OUTPUT_FILE}`);

  return artistList.length;
}

// Run the script
getArtistsWithoutImages()
  .then((count) => {
    console.log(`Successfully saved ${count} artists to file`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
