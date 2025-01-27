import type { Express } from "express";
import { createServer, type Server } from "http";

// Using koolyp's show data
const mockStats = {
  totalShows: 214,
  uniqueSongs: 892,
  totalSongs: 2456,
  averageSetLength: 18.2
};

const mockShows = [
  {
    id: 1,
    date: "2024-01-26",
    venue: "The Met",
    city: "Philadelphia",
    state: "PA",
    setlist: ["First Tube", "Carini", "Everything's Right", "Stash", "Theme From the Bottom", "Bathtub Gin", "A Wave of Hope", "Drift While You're Sleeping"]
  },
  {
    id: 2,
    date: "2024-01-25",
    venue: "TD Garden",
    city: "Boston",
    state: "MA", 
    setlist: ["Set Your Soul Free", "Undermind", "Steam", "Back on the Train", "Mercury", "Most Events Aren't Planned", "Walls of the Cave"]
  },
  {
    id: 3,
    date: "2024-01-24",
    venue: "Madison Square Garden",
    city: "New York",
    state: "NY",
    setlist: ["Tweezer", "Sand", "Plasma", "Free", "You Enjoy Myself", "Ghost", "Fluffhead", "Harry Hood"]
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