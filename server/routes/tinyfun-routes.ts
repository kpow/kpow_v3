import express, { type Router } from "express";
import path from "path";

// tinyfun firmware, for kpow.xyz/tinyfun/update.
//
//   GET /tinyfun/firmware/manifest.json     {version, notes, builds.s3.{url,size,md5}}
//   GET /tinyfun/firmware/tinyfun-s3-vX.Y.Z.bin
//
// tinyfun has no internet: a phone downloads the .bin from the update page,
// then uploads it to the console over the console's own hotspot.
// The files are committed in firmware/tinyfun/ by
// scripts/publish-tinyfun-firmware.mjs. Not in client/public: a tinyfun/
// folder there makes the production static server 301 /tinyfun to /tinyfun/.
// no-cache so a new release shows up at once; CORS like tinyradar's (harmless).
// A missing file is a plain 404, never the app's index.html.

const DIR = path.join(process.cwd(), "firmware", "tinyfun");

const headers: express.RequestHandler = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cache-Control", "no-cache");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
};

export function registerTinyfunRoutes(router: Router) {
  const files = express.static(DIR, { index: false, fallthrough: false, cacheControl: false });
  router.use("/tinyfun/firmware", headers, files);
}
