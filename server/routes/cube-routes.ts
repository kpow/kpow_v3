import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerCubeRoutes(router: Router) {
  // Serve static files for the cube game from the public directory
  const publicPath = path.resolve(__dirname, '../../public');
  router.use('/cube', express.static(publicPath));

  // Serve the cube game HTML
  router.get('/cube', (_req, res) => {
    res.sendFile(path.resolve(publicPath, 'cube/index.html'));
  });
}