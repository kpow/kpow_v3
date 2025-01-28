import type { Express } from "express";
import { createServer, type Server } from "http";
import { XMLParser } from "fast-xml-parser";

if (!process.env.GOODREADS_API_KEY) {
  throw new Error("GOODREADS_API_KEY environment variable is required");
}

const GOODREADS_API_BASE = "https://www.goodreads.com";
const GOODREADS_USER_ID = "457389";

async function fetchGoodreadsData(endpoint: string, params: Record<string, string> = {}) {
  try {
    const apiKey = process.env.GOODREADS_API_KEY;
    if (!apiKey) {
      throw new Error("Goodreads API key is not set");
    }

    const queryParams = new URLSearchParams({
      key: apiKey,
      v: "2",
      ...params
    });

    const url = `${GOODREADS_API_BASE}${endpoint}?${queryParams}`;
    console.log("Fetching from Goodreads:", url);

    const response = await fetch(url);
    const xmlData = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to fetch data from Goodreads API: ${response.statusText}`);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
    });

    const result = parser.parse(xmlData);
    console.log("Parsed Goodreads response:", JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("Error fetching from Goodreads:", error);
    throw error;
  }
}

export function registerRoutes(app: Express): Server {
  app.get("/api/shows", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const shows = await fetchPhishData("/attendance/username/koolyp");

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
        country: show.country,
        notes: show.notes,
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

      const venueStats = shows.reduce(
        (acc: { [key: string]: number }, show: any) => {
          acc[show.venue] = (acc[show.venue] || 0) + 1;
          return acc;
        },
        {},
      );

      const sortedVenues = Object.entries(venueStats)
        .map(([venue, count]) => ({ venue, count: Number(count) }))
        .sort((a, b) => b.count - a.count);

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

        const formatSet = (songs: any[]) => {
          return songs
            .sort((a, b) => a.position - b.position)
            .map((song) => song.name + song.transition)
            .join(" ")
            .trim();
        };

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

  app.get("/api/lastfm/recent-tracks", async (_req, res) => {
    try {
      const data = await fetchLastFmData("user.getrecenttracks", {
        user: "krakap",
        limit: "100",
        page: "1",
      });

      console.log("Last.fm data before transformation:", data);

      if (!data.recenttracks?.track) {
        throw new Error("No tracks found in Last.fm response");
      }

      const tracks = data.recenttracks.track.map((track: any) => ({
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"],
        image: track.image.find((img: any) => img.size === "large")["#text"],
        url: track.url,
        date: track.date?.uts
          ? new Date(Number(track.date.uts) * 1000).toISOString()
          : null,
        nowPlaying: !!track["@attr"]?.nowplaying,
      }));

      console.log("Transformed tracks:", tracks);

      res.json({ tracks });
    } catch (error) {
      console.error("Error in /api/lastfm/recent-tracks:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const shelf = (req.query.shelf as string) || "read";

      console.log(`Fetching books. Page: ${page}, Limit: ${limit}, Shelf: ${shelf}`);

      const data = await fetchGoodreadsData(`/review/list/${GOODREADS_USER_ID}.xml`, {
        per_page: limit.toString(),
        page: page.toString(),
        shelf,
        sort: "date_read",
        order: "d"
      });

      if (!data.GoodreadsResponse?.reviews?.review) {
        throw new Error("No books found in Goodreads response");
      }

      const reviews = Array.isArray(data.GoodreadsResponse.reviews.review) 
        ? data.GoodreadsResponse.reviews.review 
        : [data.GoodreadsResponse.reviews.review];

      const books = reviews.map((review: any) => ({
        id: review.book.id,
        title: review.book.title,
        author: review.book.authors.author.name,
        image_url: review.book.image_url,
        link: review.book.link,
        rating: review.rating,
        date_read: review.read_at,
        review_text: review.body,
        shelves: review.shelves?.shelf?.map((s: any) => s._name).join(", ") || ""
      }));

      const total = parseInt(data.GoodreadsResponse.reviews._total) || 0;
      const totalPages = Math.ceil(total / limit);

      console.log(`Found ${books.length} books. Total books: ${total}, Total pages: ${totalPages}`);

      res.json({
        books,
        pagination: {
          current: page,
          total: totalPages,
          hasMore: page < totalPages,
          totalBooks: total
        }
      });
    } catch (error) {
      console.error("Error in /api/books:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function fetchLastFmData(method: string, params: Record<string, string>) {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
      throw new Error("Last.fm API key is not set");
    }

    const queryParams = new URLSearchParams();
    queryParams.append("method", method);
    queryParams.append("api_key", apiKey);
    queryParams.append("format", "json");
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    const url = `${LASTFM_API_BASE}?${queryParams.toString()}`;
    console.log("Fetching Last.fm data from:", url);

    const response = await fetch(url);
    const data = await response.json();
    console.log("Raw Last.fm response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch data from Last.fm API");
    }

    return data;
  } catch (error) {
    console.error("Error fetching from Last.fm:", error);
    throw error;
  }
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

const PHISH_API_BASE = "https://api.phish.net/v5";
const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";


function formatSongUrl(songName: string): string {
  return `https://phish.net/song/${songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}