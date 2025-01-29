import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import { parseString } from "xml2js";
import { promisify } from "util";

if (!process.env.PHISH_API_KEY) {
  throw new Error("PHISH_API_KEY environment variable is required");
}

if (!process.env.LASTFM_API_KEY) {
  throw new Error("LASTFM_API_KEY environment variable is required");
}

const PHISH_API_BASE = "https://api.phish.net/v5";
const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const GOODREADS_API_BASE = "https://www.goodreads.com";
const GOODREADS_USER_ID = "457389";
const GOODREADS_API_KEY = "ajR4uV5s4lLmYZUWI2SKXw";

const parseXMLAsync = promisify(parseString);

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
    //console.log("Fetching Last.fm data from:", url);

    const response = await fetch(url);
    const data = await response.json();
    //console.log("Raw Last.fm response:", JSON.stringify(data, null, 2));

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

      // console.log("Last.fm data before transformation:", data);

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

      //console.log("Transformed tracks:", tracks);

      res.json({ tracks });
    } catch (error) {
      console.error("Error in /api/lastfm/recent-tracks:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const page = req.query.page || "1";
      const perPage = req.query.per_page || "6"; 

      const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
      console.log(`Fetching books page ${page} with ${perPage} items per page from Goodreads`);

      const response = await axios.get(url, {
        params: {
          key: GOODREADS_API_KEY,
          v: "2",
          per_page: perPage,
          page: page,
          shelf: "read",
          sort: "date_read",
          order: "d"
        }
      });

      const result = await parseXMLAsync(response.data) as {
        GoodreadsResponse: {
          reviews: Array<{
            $: { total: string; start: string; end: string };
            review: Array<any>;
          }>;
        };
      };

      const reviews = result.GoodreadsResponse.reviews[0];

      // Extract pagination metadata
      const total = parseInt(reviews.$.total);
      const start = parseInt(reviews.$.start);
      const end = parseInt(reviews.$.end);
      const currentPage = parseInt(page as string);
      const totalPages = Math.ceil(total / parseInt(perPage as string));

      console.log("Pagination data:", {
        total,
        start,
        end,
        currentPage,
        totalPages,
        reviewCount: reviews.review?.length
      });

      // Construct a properly typed response object
      const responseData = {
        GoodreadsResponse: result.GoodreadsResponse,
        pagination: {
          total,
          start,
          end,
          currentPage,
          totalPages,
          hasMore: currentPage < totalPages
        }
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching books from Goodreads:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch books"
      });
    }
  });

  app.get("/api/starred-articles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;

      if (!process.env.FEEDBIN_KEY) {
        throw new Error("FEEDBIN_KEY environment variable is required");
      }

      // First, get total count
      console.log('Fetching starred articles count...');
      const countResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
        params: {
          starred: true,
          per_page: 1,
          order: 'desc' // Ensure we're getting newest first
        },
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });

      const totalCount = parseInt(countResponse.headers['total-count'] || '0');
      console.log(`Total starred articles: ${totalCount}`);

      // Then get paginated data
      console.log(`Fetching page ${page} of starred articles...`);
      const response = await axios.get('https://api.feedbin.com/v2/entries.json', {
        params: {
          starred: true,
          per_page: perPage,
          page: page,
          order: 'desc' // Ensure we're getting newest first in paginated results
        },
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });

      // Log the first article's date to verify ordering
      if (response.data.length > 0) {
        console.log('First article published date:', response.data[0].published);
      }

      // Fetch content details for each article
      const articlesWithDetails = await Promise.all(
        response.data.map(async (article: any) => {
          try {
            if (article.extracted_content_url) {
              const contentResponse = await axios.get(article.extracted_content_url);
              return {
                ...article,
                lead_image_url: contentResponse.data.lead_image_url,
                excerpt: contentResponse.data.excerpt
              };
            }
            return article;
          } catch (error) {
            console.error(`Error fetching content for article ${article.id}:`, error);
            return article;
          }
        })
      );

      const articles = articlesWithDetails.map((article: any) => ({
        id: article?.id ?? 0,
        title: article?.title ?? 'Untitled Article',
        author: article?.author ?? 'Unknown Author',
        summary: article?.excerpt ?? article?.summary ?? article?.content ?? 'No content available',
        url: article?.url ?? '#',
        lead_image_url: article?.lead_image_url ?? null,
        published: article?.published ?? new Date().toISOString(),
        feed: {
          title: article?.feed?.title ?? 'Unknown Feed',
          url: article?.feed?.feed_url ?? '#'
        }
      }));

      const totalPages = Math.ceil(totalCount / perPage);

      res.json({
        articles,
        pagination: {
          current_page: page,
          per_page: perPage,
          total: totalCount,
          total_pages: totalPages
        }
      });

    } catch (error) {
      console.error("Error fetching starred articles:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch starred articles",
        articles: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total: 0,
          total_pages: 0
        }
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function formatSongUrl(songName: string): string {
  return `https://phish.net/song/${songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}