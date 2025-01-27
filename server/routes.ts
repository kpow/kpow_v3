import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import { db } from "@db";
import { shows, songs, setlists, setlistSongs } from "@db/schema";
import { eq } from "drizzle-orm";

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

      // Store shows in database
      const showsData = response.data.data.map((show: any) => ({
        showId: show.showid,
        date: new Date(show.showdate),
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country,
      }));

      await db.insert(shows).values(showsData)
        .onConflictDoNothing({ target: shows.showId });

      res.json({ shows: showsData });
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

      // Store setlist in database
      const setlist = await db.insert(setlists)
        .values({
          showId: showId,
          notes: setlistData.setlistnotes,
        })
        .returning();

      // Process and store songs
      const songsList = setlistData.songdata.map((song: any, idx: number) => ({
        title: song.song,
        debut_date: song.debut_date ? new Date(song.debut_date) : null,
        last_played: song.last_played ? new Date(song.last_played) : null,
      }));

      // Insert songs and get their IDs
      await db.insert(songs)
        .values(songsList)
        .onConflictDoNothing({ target: songs.title });

      // Link songs to setlist
      const dbSongs = await db.select().from(songs)
        .where(eq(songs.title, songsList.map(s => s.title)));

      const setlistSongsData = setlistData.songdata.map((song: any, idx: number) => ({
        setlistId: setlist[0].id,
        songId: dbSongs.find(s => s.title === song.song)?.id as number,
        set_number: parseInt(song.set) || 1,
        position: idx + 1,
        transition: song.transition || null,
        notes: song.annotations || null,
      }));

      await db.insert(setlistSongs).values(setlistSongsData);

      res.json({ setlist: setlistData });
    } catch (error) {
      console.error("Error fetching setlist:", error);
      res.status(500).json({ error: "Failed to fetch setlist" });
    }
  });

  // Get statistics about shows and songs
  app.get("/api/stats", async (req, res) => {
    try {
      const [showCount, songStats] = await Promise.all([
        db.select().from(shows).execute(),
        db.select().from(songs)
          .leftJoin(setlistSongs, eq(songs.id, setlistSongs.songId))
          .groupBy(songs.id)
          .execute(),
      ]);

      const stats = {
        totalShows: showCount.length,
        totalSongs: songStats.length,
        mostPlayedSongs: songStats
          .sort((a, b) => (b.times_played || 0) - (a.times_played || 0))
          .slice(0, 10),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}