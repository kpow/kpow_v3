import type { Express } from "express";
import { createServer, type Server } from "http";

if (!process.env.PHISH_API_KEY) {
  throw new Error("PHISH_API_KEY environment variable is required");
}

const PHISH_API_BASE = "https://api.phish.net/v5";

interface VenueCount {
  venue: string;
  count: number;
}

async function fetchPhishData(endpoint: string) {
  try {
    const apiKey = process.env.PHISH_API_KEY;
    const response = await fetch(
      `${PHISH_API_BASE}${endpoint}.json?apikey=${apiKey}`,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch data from Phish.net API",
      );
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching from Phish.net:", error);
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

      const shows = await fetchPhishData("/attendance/username/koolyp");

      // Debug log to see tour information
      console.log("First show tour data:", shows[0].tour, typeof shows[0].tour);

      const sortedShows = shows.sort(
        (a: any, b: any) =>
          new Date(b.showdate).getTime() - new Date(a.showdate).getTime(),
      );

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedShows = sortedShows.slice(start, end);

      const formattedShows = paginatedShows.map((show: any) => ({
        id: show.showid,
        date: show.showdate,
        venue: show.venue,
        location: `${show.city}, ${show.state}`,
        showday: show.showday,
        tour: show.tourname || "", // Changed from show.tour to show.tourname
        url: show.permalink,
      }));

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
        .map(([venue, count]): VenueCount => ({ venue, count }))
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
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/setlists/:showId", async (req, res) => {
    try {
      const { showId } = req.params;
      const setlistData = await fetchPhishData(`/setlists/showid/${showId}`);

      if (Array.isArray(setlistData) && setlistData.length > 0) {
        // Group songs by set
        const setGroups = setlistData.reduce((acc: any, song: any) => {
          if (!acc[song.set]) {
            acc[song.set] = [];
          }
          acc[song.set].push({
            name: song.song,
            transition: song.trans_mark,
            position: song.position,
            jamchart: song.isjamchart ? song.jamchart_description : null,
          });
          return acc;
        }, {});

        // Format the setlist text
        const formatSet = (songs: any[]) => {
          return songs
            .sort((a, b) => a.position - b.position)
            .map((song) => song.name + song.transition)
            .join(" ")
            .trim();
        };

        // Build the complete setlist text
        let setlistText = "";
        if (setGroups["1"]) {
          setlistText += "Set 1: " + formatSet(setGroups["1"]) + "\n\n";
        }
        if (setGroups["2"]) {
          setlistText += "Set 2: " + formatSet(setGroups["2"]) + "\n\n";
        }
        if (setGroups["e"]) {
          setlistText += "Encore: " + formatSet(setGroups["e"]) + "\n\n";
        }

        const firstSong = setlistData[0];
        res.json({
          showdate: firstSong.showdate,
          venue: firstSong.venue,
          location: `${firstSong.city}, ${firstSong.state}`,
          setlistdata: setlistText,
          setlistnotes: firstSong.setlistnotes || "",
        });
      } else {
        res.status(404).json({ message: "Setlist not found" });
      }
    } catch (error) {
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
      console.error("Error fetching song stats:", error);
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
      console.error("Error fetching song setlist:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}