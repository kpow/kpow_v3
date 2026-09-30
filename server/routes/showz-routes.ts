import type { Router } from "express";

// k-shows: concert clips published by the showz namer (~/projects/showz/namer).
//
//   GET /api/showz  ->  ShowzData (nights newest first, clip ids resolve against `base`)
//
// The namer's `node publish.mjs` writes shows.json and the web clips to the
// kfiles Space, so new nights show up here without a redeploy. The file is
// cached in memory for 5 minutes and a stale copy is served if the Space fails.
//
// shows.json is read from the Space's origin, not its CDN: the CDN edge keeps
// files for an hour whatever their Cache-Control says, and this file keeps the
// same name on every publish. Clips and stills (new names each time) still come
// from the CDN via `base` in the JSON.

const SHOWZ_URL =
  process.env.SHOWZ_JSON_URL ||
  "https://kfiles.atl1.digitaloceanspaces.com/showz/shows.json";
const TTL_MS = 5 * 60 * 1000;

let cache: { at: number; body: unknown } | null = null;

export function registerShowzRoutes(router: Router) {
  router.get("/api/showz", async (_req, res) => {
    if (cache && Date.now() - cache.at < TTL_MS) return res.json(cache.body);
    try {
      const r = await fetch(SHOWZ_URL, { headers: { "cache-control": "no-cache" } });
      if (!r.ok) throw new Error(`CDN ${r.status}`);
      cache = { at: Date.now(), body: await r.json() };
      res.json(cache.body);
    } catch (err) {
      console.error("showz fetch failed:", err);
      if (cache) return res.json(cache.body);
      res.status(502).json({ error: "shows unavailable" });
    }
  });
}
