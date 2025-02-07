import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { registerPhishRoutes } from "./routes/phish-routes";
import { registerLastFmRoutes } from "./routes/lastfm-routes";
import { registerGoodreadsRoutes } from "./routes/goodreads-routes";
import { registerFeedbinRoutes } from "./routes/feedbin-routes";
import { registerGithubRoutes } from "./routes/github-routes";
import youtubeRoutes from "./routes/youtube-routes";
import contactRoutes from "./routes/contact-routes";
import instagramRoutes from "./routes/instagram-routes";
import yelpRoutes from "./routes/yelp";

// Verify required environment variables
if (!process.env.PHISH_API_KEY) {
  throw new Error("PHISH_API_KEY environment variable is required");
}

if (!process.env.LASTFM_API_KEY) {
  throw new Error("LASTFM_API_KEY environment variable is required");
}

if (!process.env.YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY environment variable is required");
}

if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
  throw new Error("INSTAGRAM_ACCESS_TOKEN environment variable is required");
}

if (!process.env.YELP_API_KEY) {
  throw new Error("YELP_API_KEY environment variable is required");
}

export function registerRoutes(app: Express): Server {
  const router = Router();

  // Register all route modules
  registerPhishRoutes(router);
  registerLastFmRoutes(router);
  registerGoodreadsRoutes(router);
  registerFeedbinRoutes(router);
  registerGithubRoutes(router);

  // Register YouTube routes
  router.use('/api/youtube', youtubeRoutes);

  // Register Instagram routes
  router.use('/api/instagram', instagramRoutes);

  // Register Yelp routes
  router.use('/api/yelp', yelpRoutes);

  // Register contact routes
  router.use('/', contactRoutes);

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