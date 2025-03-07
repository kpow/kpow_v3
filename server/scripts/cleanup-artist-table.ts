
import { db } from "@db/index";
import { artists } from "@db/schema";

async function cleanupArtistTable() {
  try {
    console.log("Starting database cleanup...");
    
    // Step 1: Clear all image_url data
    console.log("Clearing all image_url data...");
    await db.update(artists)
      .set({ imageUrl: null })
      .returning({ id: artists.id, name: artists.name });
    
    console.log("Successfully cleared all image_url data.");
    
    // We need to use raw SQL for altering the table structure
    console.log("Dropping columns: images, lastfmUrl, mbid...");
    
    // Using raw SQL to drop the columns
    await db.execute(`
      ALTER TABLE artists 
      DROP COLUMN IF EXISTS images,
      DROP COLUMN IF EXISTS lastfm_url, 
      DROP COLUMN IF EXISTS mbid;
    `);
    
    console.log("Successfully dropped columns.");
    console.log("Database cleanup completed successfully!");
  } catch (error) {
    console.error("Error during database cleanup:", error);
  }
}

cleanupArtistTable()
  .then(() => {
    console.log("Cleanup script execution finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error in cleanup script:", error);
    process.exit(1);
  });
