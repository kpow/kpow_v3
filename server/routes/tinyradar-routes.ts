import express, { type Router } from "express";
import path from "path";

// tinyradar firmware, read by the radar's own web page (http://tinyradar.local).
//
//   GET /tinyradar/firmware/manifest.json     {version, notes, builds.s3.{url,size,md5}}
//   GET /tinyradar/firmware/tinyradar-s3-vX.Y.Z.bin
//   GET /plane-radar/firmware/*               the same files, for radars on firmware
//                                             from before the tinyradar rename
//
// The files are committed in firmware/tinyradar/ by
// scripts/publish-tinyradar-firmware.mjs. Not in client/public: a tinyradar/
// folder there makes the production static server 301 /tinyradar to /tinyradar/.
// The radar's page is an http:// page on the home network, so it can only read
// them with CORS: both paths send Access-Control-Allow-Origin: *, and no-cache
// so a new release shows up at once.
// A missing file is a plain 404, never the app's index.html.

const DIR = path.join(process.cwd(), "firmware", "tinyradar");

const cors: express.RequestHandler = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cache-Control", "no-cache");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
};

export function registerTinyradarRoutes(router: Router) {
  const files = express.static(DIR, { index: false, fallthrough: false, cacheControl: false });
  router.use("/tinyradar/firmware", cors, files);
  router.use("/plane-radar/firmware", cors, files);
  // the pages were planned at /plane-radar before the rename
  router.get(["/plane-radar", "/plane-radar/"], (_req, res) => res.redirect(301, "/tinyradar"));
}
