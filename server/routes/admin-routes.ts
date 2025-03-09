import { Router } from "express";
import axios from "axios";
import { db } from "@db";
import { artists } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerAdminRoutes(router: Router) {
  // iTunes search endpoint
  router.get("/api/admin/search-itunes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user?.id;
    if (userId !== 1) {
      return res.status(403).json({ error: "Not authorized" });
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

    const userId = req.user?.id;
    if (userId !== 1) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { artistName, imageUrl } = req.body;
    if (!artistName || !imageUrl) {
      return res.status(400).json({ error: "Artist name and image URL are required" });
    }

    try {
      console.log(`[Artist Update] Updating image for artist: ${artistName}`);
      const result = await db
        .update(artists)
        .set({ imageUrl })
        .where(eq(artists.name, artistName))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Artist not found" });
      }

      console.log(`[Artist Update] Successfully updated image for artist: ${artistName}`);
      res.json({ message: "Artist image updated successfully", artist: result[0] });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to update artist image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}