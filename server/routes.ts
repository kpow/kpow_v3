import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import express from "express";
import path from "path";
import { registerPhishRoutes } from "./routes/phish-routes";
import { registerLastFmRoutes } from "./routes/lastfm-routes";
import { registerGoodreadsRoutes } from "./routes/goodreads-routes";
import { registerFeedbinRoutes } from "./routes/feedbin-routes";
import { registerGithubRoutes } from "./routes/github-routes";
import { registerMusicRoutes } from "./routes/music-routes";
import { registerAdminRoutes } from "./routes/admin-routes";
import youtubeRoutes from "./routes/youtube-routes";
import contactRoutes from "./routes/contact-routes";
import instagramRoutes from "./routes/instagram-routes";
import yelpRoutes from "./routes/yelp";
import tableRoutes from "./routes/table";

export function registerRoutes(app: Express): Server {
  const router = Router();

  // Set up authentication routes and middleware
  setupAuth(app);

  // Register all route modules
  registerPhishRoutes(router);
  registerLastFmRoutes(router);
  registerGoodreadsRoutes(router);
  registerFeedbinRoutes(router);
  registerGithubRoutes(router);
  registerMusicRoutes(router);
  registerAdminRoutes(router);

  // Register YouTube routes
  router.use('/api/youtube', youtubeRoutes);

  // Register Instagram routes
  router.use('/api/instagram', instagramRoutes);

  // Register Yelp routes
  router.use('/api/yelp', yelpRoutes);

  // Register table routes
  router.use('/api/table', tableRoutes);

  // Register contact routes
  router.use('/', contactRoutes);

  // Serve static files from the cube directory
  router.use('/cube', express.static(path.join(process.cwd(), 'client', 'public', 'cube')));

  // Serve the cube index.html
  router.get('/cube', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client', 'public', 'cube', 'index.html'));
  });

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