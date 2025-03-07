import { db } from "@db/index";
import { artists } from "@db/schema";
import { sql } from "drizzle-orm";

async function cleanupArtistBio() {
  try {
    console.log("Starting bio cleanup...");

    // Find artists with Last.fm placeholder bio
    const results = await db.execute(sql`
      UPDATE artists 
      SET bio = NULL 
      WHERE bio LIKE '% <a href="%last.fm/music/%">Read more on Last.fm</a>'
      RETURNING id, name, bio;
    `);

    const cleanedCount = results.length || 0;
    console.log(`Cleaned up ${cleanedCount} artist bios`);

    if (cleanedCount > 0) {
      console.log("\nExample cleaned artists:");
      results.slice(0, 5).forEach((row: any) => {
        console.log(`- ${row.name}`);
      });
    }

  } catch (error) {
    console.error("Error during bio cleanup:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the script
cleanupArtistBio()
  .then(() => {
    console.log("Bio cleanup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error in cleanup script:", error);
    process.exit(1);
  });