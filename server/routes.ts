import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

const PHISH_API_BASE = "https://api.phish.net/v5";

if (!process.env.PHISHNET_API_KEY) {
  throw new Error("PHISHNET_API_KEY environment variable is required");
}

export function registerRoutes(app: Express): Server {
  // Fetch attended shows for a user
  app.get("/api/shows/attended/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const response = await axios.get(
        `${PHISH_API_BASE}/attendance/username/${username}.json`, 
        { params: { apikey: process.env.PHISHNET_API_KEY } }
      );

      if (response.data.error_code !== 0) {
        throw new Error(response.data.error_message);
      }

      const shows = response.data.data.map((show: any) => ({
        id: show.showid,
        date: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country,
      }));

      res.json({ shows });
    } catch (error) {
      console.error("Error fetching shows:", error);
      res.status(500).json({ error: "Failed to fetch shows" });
    }
  });

  // Fetch setlist for a specific show
  app.get("/api/shows/:showId/setlist", async (req, res) => {
    try {
      const { showId } = req.params;
      const response = await axios.get(
        `${PHISH_API_BASE}/setlists/showid/${showId}.json`,
        { params: { apikey: process.env.PHISHNET_API_KEY } }
      );

      if (response.data.error_code !== 0) {
        throw new Error(response.data.error_message);
      }

      const setlistData = response.data.data[0];

      // Process setlist data to a more usable format
      const setlist = {
        id: setlistData.showid,
        date: setlistData.showdate,
        venue: setlistData.venue,
        songs: setlistData.songdata.map((song: any) => ({
          title: song.song,
          set: song.set,
          position: song.position,
          transition: song.transition,
          notes: song.annotations,
        })),
        notes: setlistData.setlistnotes,
      };

      res.json({ setlist });
    } catch (error) {
      console.error("Error fetching setlist:", error);
      res.status(500).json({ error: "Failed to fetch setlist" });
    }
  });

  // Get statistics about shows and songs
  app.get("/api/stats/:username", async (req, res) => {
    try {
      const { username } = req.params;

      // First get all attended shows
      const showsResponse = await axios.get(
        `${PHISH_API_BASE}/attendance/username/${username}.json`,
        { params: { apikey: process.env.PHISHNET_API_KEY } }
      );

      if (showsResponse.data.error_code !== 0) {
        throw new Error(showsResponse.data.error_message);
      }

      const shows = showsResponse.data.data;

      // Get setlists for all shows
      const setlists = await Promise.all(
        shows.map((show: any) => 
          axios.get(
            `${PHISH_API_BASE}/setlists/showid/${show.showid}.json`,
            { params: { apikey: process.env.PHISHNET_API_KEY } }
          )
          .then(response => response.data.data[0])
          .catch(() => null)
        )
      );

      // Process all setlists to get song statistics
      const songStats = new Map<string, number>();
      const validSetlists = setlists.filter(setlist => setlist !== null);

      validSetlists.forEach(setlist => {
        setlist.songdata.forEach((song: any) => {
          const count = songStats.get(song.song) || 0;
          songStats.set(song.song, count + 1);
        });
      });

      // Convert song stats to sorted array
      const sortedSongs = Array.from(songStats.entries())
        .map(([song, count]) => ({ song, count }))
        .sort((a, b) => b.count - a.count);

      const stats = {
        totalShows: shows.length,
        totalSongs: songStats.size,
        mostPlayedSongs: sortedSongs.slice(0, 10),
        venues: Array.from(new Set(shows.map((show: any) => show.venue))).length,
        showsByYear: shows.reduce((acc: Record<string, number>, show: any) => {
          const year = new Date(show.showdate).getFullYear();
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error calculating stats:", error);
      res.status(500).json({ error: "Failed to calculate statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}