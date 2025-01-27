import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { shows, venues, songs, setlistItems } from "@db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Get stats for a specific year
  app.get("/api/phish/stats/:year", async (req, res) => {
    const year = req.params.year;
    try {
      // Get total shows for the year
      const totalShows = await db
        .select({ count: sql<number>`count(*)` })
        .from(shows)
        .where(sql`EXTRACT(YEAR FROM date) = ${year}`);

      // Get unique songs played that year
      const uniqueSongs = await db
        .select({ count: sql<number>`count(DISTINCT song_id)` })
        .from(setlistItems)
        .innerJoin(shows, eq(shows.id, setlistItems.showId))
        .where(sql`EXTRACT(YEAR FROM date) = ${year}`);

      // Get total songs played that year
      const totalSongs = await db
        .select({ count: sql<number>`count(*)` })
        .from(setlistItems)
        .innerJoin(shows, eq(shows.id, setlistItems.showId))
        .where(sql`EXTRACT(YEAR FROM date) = ${year}`);

      // Calculate average set length
      const averageSetLength = totalSongs[0].count / totalShows[0].count;

      res.json({
        totalShows: totalShows[0].count,
        uniqueSongs: uniqueSongs[0].count,
        totalSongs: totalSongs[0].count,
        averageSetLength,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get shows for a specific year with full details
  app.get("/api/phish/shows/:year", async (req, res) => {
    const year = req.params.year;
    try {
      const showsData = await db
        .select({
          id: shows.id,
          date: shows.date,
          venue: venues.name,
          city: venues.city,
          state: venues.state,
        })
        .from(shows)
        .innerJoin(venues, eq(venues.id, shows.venueId))
        .where(sql`EXTRACT(YEAR FROM ${shows.date}) = ${year}`)
        .orderBy(desc(shows.date));

      // For each show, get its setlist
      const showsWithSetlists = await Promise.all(
        showsData.map(async (show) => {
          const setlist = await db
            .select({
              songName: songs.name,
            })
            .from(setlistItems)
            .innerJoin(songs, eq(songs.id, setlistItems.songId))
            .where(eq(setlistItems.showId, show.id))
            .orderBy(setlistItems.position);

          return {
            ...show,
            setlist: setlist.map((item) => item.songName),
          };
        })
      );

      res.json(showsWithSetlists);
    } catch (error) {
      console.error("Error fetching shows:", error);
      res.status(500).json({ error: "Failed to fetch shows" });
    }
  });

  // Add song stats endpoint
  app.get("/api/phish/songs/stats", async (req, res) => {
    try {
      const songStats = await db
        .select({
          name: songs.name,
          timesPlayed: songs.timesPlayed,
          lastPlayed: songs.lastPlayed,
          debut: songs.debut,
          gap: songs.gap,
        })
        .from(songs)
        .orderBy(desc(songs.timesPlayed))
        .limit(50);

      res.json(songStats);
    } catch (error) {
      console.error("Error fetching song stats:", error);
      res.status(500).json({ error: "Failed to fetch song stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}