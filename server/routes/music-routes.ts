import { Router } from "express";
import { db } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { artists, plays } from "@db/schema";

export function registerMusicRoutes(router: Router) {
  // Get top artists by play count
  router.get("/api/music/top-artists", async (_req, res) => {
    try {
      const topArtists = await db
        .select({
          id: artists.id,
          name: artists.name,
          bio: artists.bio,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
          lastPlayed: sql<string>`MAX(${plays.timestamp})`.as('last_played')
        })
        .from(artists)
        .leftJoin(plays, eq(plays.artistId, artists.id))
        .groupBy(artists.id)
        .orderBy(desc(sql`play_count`))
        .limit(10);

      res.json({ artists: topArtists });
    } catch (error) {
      console.error("Error fetching top artists:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch top artists" 
      });
    }
  });

  // Get single artist details with recent plays
  router.get("/api/music/artists/:id", async (req, res) => {
    try {
      const artistId = req.params.id;

      const artist = await db.query.artists.findFirst({
        where: eq(artists.id, artistId),
        with: {
          plays: {
            limit: 10,
            orderBy: [desc(plays.timestamp)]
          }
        }
      });

      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }

      res.json({ artist });
    } catch (error) {
      console.error("Error fetching artist details:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch artist details" 
      });
    }
  });
}