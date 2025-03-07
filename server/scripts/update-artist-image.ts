
import { db } from "@db/index";
import { artists } from "@db/schema";
import { eq } from "drizzle-orm";
import { argv } from "process";

async function updateArtistImage() {
  try {
    if (argv.length < 4) {
      console.log("Usage: npx tsx server/scripts/update-artist-image.ts \"Artist Name\" \"Image URL\"");
      process.exit(1);
    }

    const artistName = argv[2];
    const imageUrl = argv[3];

    console.log(`Updating image for artist: ${artistName}`);
    console.log(`New image URL: ${imageUrl}`);

    // Update the artist in the database
    const result = await db
      .update(artists)
      .set({ imageUrl: imageUrl })
      .where(eq(artists.name, artistName))
      .returning({ id: artists.id, name: artists.name, imageUrl: artists.imageUrl });

    if (result.length === 0) {
      console.log(`Artist "${artistName}" not found in the database.`);
      
      // Option to insert the artist
      console.log(`Would you like to insert this artist with the provided image URL? (y/n)`);
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
          const insertResult = await db
            .insert(artists)
            .values({ name: artistName, imageUrl: imageUrl })
            .returning({ id: artists.id, name: artists.name, imageUrl: artists.imageUrl });
          
          console.log("Artist inserted successfully:", insertResult[0]);
        }
        process.exit(0);
      });
    } else {
      console.log("Artist updated successfully:", result[0]);
      process.exit(0);
    }
  } catch (error) {
    console.error("Error updating artist image:", error);
    process.exit(1);
  }
}

updateArtistImage();
