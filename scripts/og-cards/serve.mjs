#!/usr/bin/env node
// og-cards — makes the 1200×630 share images in client/public/og/ and the app
// icons (apple-touch-icon, icon-192/512) from real page photos.
//
//   node scripts/og-cards/serve.mjs      then open http://localhost:5199/
//
// The page (cards.html) draws every card on a canvas with the site's fonts and
// posts each one back here; this writes them into client/public. Add ?only=vizbot
// to redo one card, ?dry to just look. Cards are listed in cards.html (CARDS);
// their alt text and use live in client/src/lib/page-meta.ts.

import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(HERE, "..", "..", "client", "public");
const PORT = Number(process.env.PORT || 5199);
const TYPES = { ".html": "text/html", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
// only these may be written
const WRITABLE = /^(og\/[a-z0-9-]+\.jpg|apple-touch-icon\.png|icon-(192|512)\.png)$/;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html" }).end(readFileSync(join(HERE, "cards.html")));
    } else if (req.method === "GET" && url.pathname.startsWith("/public/")) {
      const file = normalize(join(PUBLIC, decodeURIComponent(url.pathname.slice(8))));
      if (!file.startsWith(PUBLIC) || !existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
    } else if (req.method === "GET" && url.pathname === "/remote") {
      // a photo from the CDN (k-shows stills), fetched here so the canvas isn't tainted
      const r = await fetch(url.searchParams.get("u"));
      res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "image/jpeg" }).end(Buffer.from(await r.arrayBuffer()));
    } else if (req.method === "POST" && url.pathname === "/save") {
      const name = url.searchParams.get("file") || "";
      if (!WRITABLE.test(name)) return res.writeHead(400).end("not writable");
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const out = join(PUBLIC, name);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.concat(chunks));
      console.log(`wrote client/public/${name}`);
      res.writeHead(200).end("ok");
    } else {
      res.writeHead(404).end();
    }
  } catch (e) {
    console.error(e);
    res.writeHead(500).end(String(e));
  }
}).listen(PORT, () => console.log(`og-cards on http://localhost:${PORT}/`));
