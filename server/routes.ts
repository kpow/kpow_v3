import type { Express } from "express";
import { createServer, type Server } from "http";

const PHISH_API_BASE = "https://api.phish.net/v5";

interface VenueCount {
  venue: string;
  count: number;
}

interface ShowData {
  showid: string;
  showdate: string;
  venue: string;
  city: string;
  state: string;
  country?: string;
  notes?: string;
}

async function fetchPhishData(endpoint: string) {
  const apiKey = process.env.PHISH_API_KEY;
  if (!apiKey) {
    throw new Error("PHISH_API_KEY is not set");
  }

  const response = await fetch(
    `${PHISH_API_BASE}${endpoint}.json?apikey=${apiKey}`,
  );

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data || !data.data) {
    throw new Error("Invalid API response format");
  }

  return data.data;
}

export function registerRoutes(app: Express): Server {
  app.get("/api/shows", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const shows = await fetchPhishData("/attendance/username/koolyp");

      if (!Array.isArray(shows)) {
        throw new Error("Invalid shows data format");
      }

      const sortedShows = (shows as ShowData[]).sort(
        (a, b) => new Date(b.showdate).getTime() - new Date(a.showdate).getTime()
      );

      const total = sortedShows.length;
      const start = (page - 1) * limit;
      const end = Math.min(start + limit, total);
      const paginatedShows = sortedShows.slice(start, end);

      const formattedShows = paginatedShows.map((show: ShowData) => ({
        showid: show.showid,
        showdate: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country || "US",
        notes: show.notes || ""
      }));

      res.json({
        shows: formattedShows,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          hasMore: end < total,
          totalItems: total,
          limit
        },
      });
    } catch (error) {
      console.error("Error in /api/shows:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/venues/stats", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const shows = await fetchPhishData("/attendance/username/koolyp") as ShowData[];

      const venueStats = shows.reduce((acc: { [key: string]: number }, show: ShowData) => {
        acc[show.venue] = (acc[show.venue] || 0) + 1;
        return acc;
      }, {});

      const sortedVenues: VenueCount[] = Object.entries(venueStats)
        .map(([venue, count]): VenueCount => ({ venue, count }))
        .sort((a, b) => b.count - a.count);

      const total = sortedVenues.length;
      const start = (page - 1) * limit;
      const end = Math.min(start + limit, total);
      const paginatedVenues = sortedVenues.slice(start, end);

      res.json({
        venues: paginatedVenues,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          hasMore: end < total,
          totalItems: total,
          limit
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
      const shows = await fetchPhishData("/attendance/username/koolyp") as ShowData[];

      const uniqueVenues = new Set(shows.map((show: ShowData) => show.venue)).size;
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
      const shows = await fetchPhishData("/attendance/username/koolyp") as ShowData[];
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
      const shows = await fetchPhishData("/attendance/username/koolyp") as ShowData[];
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
              url: `https://phish.net/song/${songName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")}`,
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

  function formatSongUrl(songName: string): string {
    return `https://phish.net/song/${songName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;
  }

  const httpServer = createServer(app);
  return httpServer;
}