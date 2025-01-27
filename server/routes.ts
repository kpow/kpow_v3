import type { Express } from "express";
import { createServer, type Server } from "http";

// Mock data for development
const mockStats = {
  totalShows: 42,
  uniqueSongs: 156,
  totalSongs: 485,
  averageSetLength: 12.5
};

const mockShows = [
  {
    id: 1,
    date: "2024-01-15",
    venue: "Madison Square Garden",
    city: "New York",
    state: "NY",
    setlist: ["Tweezer", "Ghost", "Chalk Dust Torture", "YEM"]
  },
  {
    id: 2,
    date: "2024-01-14",
    venue: "TD Garden",
    city: "Boston",
    state: "MA",
    setlist: ["Down with Disease", "Free", "Foam", "Character Zero"]
  }
];

export function registerRoutes(app: Express): Server {
  // Phish Stats API endpoints
  app.get("/api/phish/stats/:year", (req, res) => {
    // In a real app, we would fetch stats for the specific year
    res.json(mockStats);
  });

  app.get("/api/phish/shows/:year", (req, res) => {
    // In a real app, we would fetch shows for the specific year
    res.json(mockShows);
  });

  const httpServer = createServer(app);
  return httpServer;
}