import type { Express } from "express";
import { createServer, type Server } from "http";

const PHISH_API_BASE = "https://api.phish.net/v5";

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

  const response = await fetch(`${PHISH_API_BASE}${endpoint}.json?apikey=${apiKey}`);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export function registerRoutes(app: Express): Server {
  // Shows endpoint with pagination
  app.get("/api/shows", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const shows = await fetchPhishData("/attendance/username/koolyp");

      // Sort shows by date descending
      const sortedShows = shows.sort((a: ShowData, b: ShowData) => 
        new Date(b.showdate).getTime() - new Date(a.showdate).getTime()
      );

      // Calculate pagination
      const total = sortedShows.length;
      const start = (page - 1) * limit;
      const end = Math.min(start + limit, total);
      const items = sortedShows.slice(start, end).map(show => ({
        showid: show.showid,
        showdate: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country || "US",
        notes: show.notes || ""
      }));

      res.json({
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: end < total
        }
      });
    } catch (error) {
      console.error("Error in /api/shows:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Venues endpoint with pagination
  app.get("/api/venues/stats", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const shows = await fetchPhishData("/attendance/username/koolyp");

      // Count venues
      const venueStats = shows.reduce((acc: Record<string, number>, show: ShowData) => {
        acc[show.venue] = (acc[show.venue] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort by count
      const venues = Object.entries(venueStats)
        .map(([venue, count]) => ({ venue, count }))
        .sort((a, b) => b.count - a.count);

      // Apply pagination
      const total = venues.length;
      const start = (page - 1) * limit;
      const end = Math.min(start + limit, total);
      const items = venues.slice(start, end);

      res.json({
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: end < total
        }
      });
    } catch (error) {
      console.error("Error in /api/venues/stats:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/runs/stats", async (_req, res) => {
    try {
      const shows = await fetchPhishData("/attendance/username/koolyp");

      const uniqueVenues = new Set(shows.map((show: ShowData) => show.venue)).size;
      const totalShows = shows.length;

      res.json({
        totalShows,
        uniqueVenues,
      });
    } catch (error) {
      console.error("Error in /api/runs/stats:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}