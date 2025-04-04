import { db } from "../db";
import { authors } from "../db/schema";
import { sql } from "drizzle-orm";

/**
 * Script to clean up author image URLs
 * 
 * The image_url column in the authors table contains a JSON object with the URL in the "_" property
 * This script extracts the URL and updates the column with just the URL string
 */
async function cleanAuthorImageUrls() {
  console.log("Starting to clean author image URLs...");
  
  try {
    // Get all authors with image_url that contains a JSON object
    const authorsToUpdate = await db.execute(sql`
      SELECT id, name, image_url 
      FROM authors 
      WHERE image_url LIKE '{%'
    `);
    
    console.log(`Found ${authorsToUpdate.rows.length} authors with JSON image URLs to clean`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each author
    for (const author of authorsToUpdate.rows) {
      try {
        let imageUrl = author.image_url;
        let cleanUrl = null;
        
        try {
          // Parse the JSON and extract the URL
          const imageData = JSON.parse(imageUrl);
          if (imageData && imageData._) {
            // Get the URL and trim any whitespace or newlines
            cleanUrl = imageData._.trim();
          }
        } catch (parseError) {
          console.error(`Error parsing JSON for author ${author.id} (${author.name}):`, parseError);
          errorCount++;
          continue;
        }
        
        if (cleanUrl) {
          // Update the author record with the clean URL
          await db.execute(sql`
            UPDATE authors 
            SET image_url = ${cleanUrl}, last_updated = NOW() 
            WHERE id = ${author.id}
          `);
          
          console.log(`✅ Updated image for author ${author.id} (${author.name})`);
          successCount++;
        } else {
          console.log(`⚠️ No valid URL found for author ${author.id} (${author.name})`);
          errorCount++;
        }
      } catch (updateError) {
        console.error(`Error updating author ${author.id} (${author.name}):`, updateError);
        errorCount++;
      }
    }
    
    console.log("\nSummary:");
    console.log(`✅ Successfully updated ${successCount} authors`);
    console.log(`⚠️ Encountered errors with ${errorCount} authors`);
    console.log("Clean-up process completed!");
    
  } catch (error) {
    console.error("An error occurred while cleaning author image URLs:", error);
  }
}

// Run the function
cleanAuthorImageUrls()
  .then(() => {
    console.log("Script completed. Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed with error:", error);
    process.exit(1);
  });