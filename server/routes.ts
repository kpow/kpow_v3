import type { Express } from "express";
import { createServer, type Server } from "http";

const PHISH_API_BASE = "https://api.phish.net/v5";

interface VenueCount {
  venue: string;
  count: number;
}

async function fetchPhishData(endpoint: string) {
  try {
    const apiKey = process.env.PHISH_API_KEY;
    if (!apiKey) {
      throw new Error("PHISH_API_KEY is not set in environment variables");
    }

    console.log(`Fetching data from: ${PHISH_API_BASE}${endpoint}.json`);
    const response = await fetch(
      `${PHISH_API_BASE}${endpoint}.json?apikey=${apiKey}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.data) {
      console.error("Invalid API response format:", data);
      throw new Error("Invalid API response format");
    }

    return data.data;
  } catch (error) {
    console.error("Error in fetchPhishData:", error);
    throw error;
  }
}

function formatSongUrl(songName: string): string {
  return `https://phish.net/song/${songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

export function registerRoutes(app: Express): Server {
  app.get("/api/shows", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      console.log("Fetching shows with params:", { page, limit });
      const shows = await fetchPhishData("/attendance/username/koolyp");

      if (!Array.isArray(shows)) {
        throw new Error("Invalid shows data format");
      }

      const sortedShows = shows.sort(
        (a: any, b: any) =>
          new Date(b.showdate).getTime() - new Date(a.showdate).getTime(),
      );

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedShows = sortedShows.slice(start, end);

      const formattedShows = paginatedShows.map((show: any) => ({
        showid: show.showid,
        showdate: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country || "US",
        notes: show.notes || ""
      }));

      console.log("Formatted shows sample:", formattedShows[0]);

      const total = shows.length;
      const totalPages = Math.ceil(total / limit);

      res.json({
        shows: formattedShows,
        pagination: {
          current: page,
          total: totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error("Error in /api/shows:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/venues/stats", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const shows = await fetchPhishData("/attendance/username/koolyp");

      // Count shows per venue
      const venueStats = shows.reduce(
        (acc: { [key: string]: number }, show: any) => {
          acc[show.venue] = (acc[show.venue] || 0) + 1;
          return acc;
        },
        {},
      );

      // Convert to array and sort by count with proper typing
      const sortedVenues: VenueCount[] = Object.entries(venueStats)
        .map(([venue, count]): VenueCount => ({ venue, count: Number(count) }))
        .sort((a: VenueCount, b: VenueCount) => b.count - a.count);

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedVenues = sortedVenues.slice(start, end);

      const total = sortedVenues.length;
      const totalPages = Math.ceil(total / limit);

      res.json({
        venues: paginatedVenues,
        pagination: {
          current: page,
          total: totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error("Error in /api/venues/stats:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/setlists/:showId", async (req, res) => {
    try {
      const { showId } = req.params;
      const setlistData = await fetchPhishData(`/setlists/showid/${showId}`);

      if (Array.isArray(setlistData) && setlistData.length > 0) {
        const firstSong = setlistData[0];
        const formattedSetlist = setlistData.map((item: any) => ({
          showid: item.showid,
          set: item.set,
          song: item.song,
          position: item.position
        }));

        res.json({
          showdate: firstSong.showdate,
          venue: firstSong.venue,
          location: `${firstSong.city}, ${firstSong.state}`,
          setlistdata: formattedSetlist,
          setlistnotes: firstSong.setlistnotes || "",
        });
      } else {
        res.status(404).json({ message: "Setlist not found" });
      }
    } catch (error) {
      console.error("Error in /api/setlists:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/runs/stats", async (_req, res) => {
    try {
      const shows = await fetchPhishData("/attendance/username/koolyp");

      const uniqueVenues = new Set(shows.map((show: any) => show.venueid)).size;
      const totalShows = shows.length;

      res.json({
        totalShows,
        uniqueVenues,
      });
    } catch (error) {
      console.error("Error in /api/runs/stats:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/songs/stats", async (_req, res) => {
    try {
      const shows = await fetchPhishData("/attendance/username/koolyp");
      const songCounts = new Map<string, number>();

      // Fetch setlist for each show
      for (const show of shows) {
        const setlist = await fetchPhishData(`/setlists/showid/${show.showid}`);
        if (Array.isArray(setlist)) {
          setlist.forEach((entry: any) => {
            const songName = entry.song;
            if (songName) {
              songCounts.set(songName, (songCounts.get(songName) || 0) + 1);
            }
          });
        }
      }

      // Convert to array and sort by count
      const songStats = Array.from(songCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      res.json(songStats);
    } catch (error) {
      console.error("Error in /api/songs/stats:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/setlist/occurrences/:songName", async (req, res) => {
    try {
      const { songName } = req.params;
      const shows = await fetchPhishData("/attendance/username/koolyp");
      const songOccurrences = [];

      // Fetch setlist for each show and find occurrences of the song
      for (const show of shows) {
        const setlist = await fetchPhishData(`/setlists/showid/${show.showid}`);
        if (Array.isArray(setlist)) {
          const songInSetlist = setlist.find(
            (entry: any) => entry.song === songName,
          );
          if (songInSetlist) {
            songOccurrences.push({
              date: show.showdate,
              venue: show.venue,
              setlist: `Set ${songInSetlist.set}: ${songInSetlist.song}${songInSetlist.trans_mark || ""}`,
              url: formatSongUrl(songName),
            });
          }
        }
      }

      res.json(songOccurrences);
    } catch (error) {
      console.error("Error in /api/setlist/occurrences:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}