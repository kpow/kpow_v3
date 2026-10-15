import { Router } from "express";
import { fetchLastFmData } from "../utils/api-utils";
import { recentTracks } from "../lib/music/recent";

export function registerLastFmRoutes(router: Router) {
  // Home page "listening" feed: Last.fm and Spotify merged (server/lib/music/recent.ts).
  // Kept at this path so the home page needs no change.
  router.get("/api/lastfm/recent-tracks", async (_req, res) => {
    try {
      res.json({ tracks: await recentTracks() });
    } catch (error) {
      console.error("Error in /api/lastfm/recent-tracks:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // New endpoint for artist album lookup
  router.get("/api/lastfm/artist-albums", async (req, res) => {
    try {
      const artist = req.query.artist as string;
      if (!artist) {
        return res.status(400).json({ error: "Artist parameter is required" });
      }

      const data = await fetchLastFmData("artist.gettopalbums", {
        artist: artist,
        limit: "50"
      });

      console.log("Last.fm API Response:", data);

      if (data.error) {
        throw new Error(data.message);
      }

      res.json(data);
    } catch (error) {
      console.error("Error in /api/lastfm/artist-albums:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
}