
import { db } from "@db/index";
import { artists } from "@db/schema";
import { desc, like } from "drizzle-orm";
import { argv } from "process";

async function listArtists() {
  try {
    let searchTerm = "";
    let limit = 20;
    
    if (argv.length > 2) {
      searchTerm = argv[2];
    }
    
    if (argv.length > 3 && !isNaN(Number(argv[3]))) {
      limit = Number(argv[3]);
    }
    
    console.log(`Searching for artists${searchTerm ? ` matching "${searchTerm}"` : ""} (limit: ${limit})`);
    
    const query = db.select({
      id: artists.id,
      name: artists.name,
      imageUrl: artists.imageUrl,
    })
    .from(artists)
    .orderBy(desc(artists.id))
    .limit(limit);
    
    if (searchTerm) {
      query.where(like(artists.name, `%${searchTerm}%`));
    }
    
    const results = await query;
    
    if (results.length === 0) {
      console.log("No artists found matching your criteria.");
    } else {
      console.log(`Found ${results.length} artists:`);
      results.forEach(artist => {
        console.log(`ID: ${artist.id}, Name: ${artist.name}, Image: ${artist.imageUrl || "No image"}`);
      });
    }
    
  } catch (error) {
    console.error("Error listing artists:", error);
  }
}

listArtists();
