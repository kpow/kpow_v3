import { Router } from "express";
import axios from "axios";
import { db } from "@db";
import { artists, songs, plays } from "@db/schema";
import { eq, isNull, inArray } from "drizzle-orm";

export function registerAdminRoutes(router: Router) {
  // iTunes search endpoint
  router.get("/api/admin/search-itunes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const term = req.query.term as string;
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }

    try {
      console.log(`[iTunes Search] Searching for term: ${term}`);
      const response = await axios.get(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&entity=album&limit=5`
      );

      console.log(`[iTunes Search] Found ${response.data.resultCount} results`);
      res.json(response.data);
    } catch (error) {
      console.error("iTunes API Error:", error);
      res.status(500).json({
        error: "Failed to fetch from iTunes",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update artist image endpoint
  router.post("/api/admin/update-artist-image", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { artistName, imageUrl } = req.body;

    if (!artistName || !imageUrl) {
      return res.status(400).json({ error: "Artist name and image URL are required" });
    }

    try {
      console.log(`[Artist Update] Checking existence of artist: ${artistName}`);

      // First check if the artist exists
      const existingArtist = await db
        .select()
        .from(artists)
        .where(eq(artists.name, artistName))
        .limit(1);

      if (!existingArtist.length) {
        console.log(`[Artist Update] Artist not found: ${artistName}`);
        return res.status(404).json({ error: "Artist not found" });
      }

      console.log(`[Artist Update] Updating image for artist: ${artistName}`);

      // Process the image URL to ensure it's properly formatted
      const processedImageUrl = imageUrl.replace(/\d+x\d+/, '600x600');

      // Update only the imageUrl field
      const result = await db
        .update(artists)
        .set({ imageUrl: processedImageUrl })
        .where(eq(artists.name, artistName))
        .returning();

      console.log(`[Artist Update] Successfully updated image for artist: ${artistName}`);
      res.json({ 
        message: "Artist image updated successfully", 
        artist: result[0] 
      });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to update artist image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get songs without plays
  router.get("/api/admin/songs-without-plays", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    try {
      console.log("[Songs] Fetching songs without plays");

      // Get total songs count
      const totalCount = await db
        .select({ count: songs.id })
        .from(songs)
        .then(result => result.length);

      const songsWithoutPlays = await db
        .select({
          id: songs.id,
          name: songs.name,
          albumName: songs.albumName,
          artistName: artists.name,
        })
        .from(songs)
        .leftJoin(plays, eq(plays.songId, songs.id))
        .leftJoin(artists, eq(songs.artistId, artists.id))
        .where(isNull(plays.id));

      console.log(`[Songs] Found ${songsWithoutPlays.length} songs without plays out of ${totalCount} total songs`);
      res.json({
        songs: songsWithoutPlays,
        totalSongs: totalCount
      });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch songs without plays",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Delete selected songs
  router.post("/api/admin/delete-songs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { songIds } = req.body;
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ error: "Song IDs array is required" });
    }

    try {
      console.log(`[Songs] Deleting ${songIds.length} songs`);

      // Delete songs using inArray instead of in
      await db.delete(songs).where(inArray(songs.id, songIds));

      console.log(`[Songs] Successfully deleted ${songIds.length} songs`);
      res.json({ message: "Songs deleted successfully" });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to delete songs",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  return router;
}