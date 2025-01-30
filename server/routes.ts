import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { registerPhishRoutes } from "./routes/phish-routes";
import { registerLastFmRoutes } from "./routes/lastfm-routes";
import { registerGoodreadsRoutes } from "./routes/goodreads-routes";
import { registerFeedbinRoutes } from "./routes/feedbin-routes";
import { registerGithubRoutes } from "./routes/github-routes";

// Verify required environment variables
if (!process.env.PHISH_API_KEY) {
  throw new Error("PHISH_API_KEY environment variable is required");
}

if (!process.env.LASTFM_API_KEY) {
  throw new Error("LASTFM_API_KEY environment variable is required");
}

export function registerRoutes(app: Express): Server {
  const router = Router();

  // Register all route modules
  registerPhishRoutes(router);
  registerLastFmRoutes(router);
  registerGoodreadsRoutes(router);
  registerFeedbinRoutes(router);
  registerGithubRoutes(router);

  // Use the router
  app.use(router);

  const httpServer = createServer(app);
  return httpServer;
}

function formatSongUrl(songName: string): string {
  return `https://phish.net/song/${songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}