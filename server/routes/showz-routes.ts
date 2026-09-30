import type { Router, Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { exportAll, patchNight, publicShows, replaceAll, RevisionConflict } from "../lib/showz-store";

// k-shows: concert clips from the showz namer (~/projects/showz/namer).
//
//   GET   /api/showz                    public: named, visible nights with published clips
//   GET   /api/admin/showz              admin session: every night and clip (for /admin/shows)
//   PATCH /api/admin/showz/nights/:date admin session: edit one night (venue, bands, date, hidden…)
//   GET   /api/showz/sync               namer (Bearer SHOWZ_SYNC_TOKEN): full state + rev
//   PUT   /api/showz/sync               namer: replace full state; 409 if rev moved on
//
// Postgres (lib/showz-store.ts) is the source of truth. Until it has been
// seeded, /api/showz falls back to the shows.json the namer publishes to the
// Space. That file is read from the origin, not the CDN: the CDN edge keeps it
// for an hour whatever its Cache-Control says.

const FALLBACK_URL =
  process.env.SHOWZ_JSON_URL ||
  "https://kfiles.atl1.digitaloceanspaces.com/showz/shows.json";
const TTL_MS = 5 * 60 * 1000;

let fallback: { at: number; body: unknown } | null = null;

async function fromSpace() {
  if (fallback && Date.now() - fallback.at < TTL_MS) return fallback.body;
  const r = await fetch(FALLBACK_URL, { headers: { "cache-control": "no-cache" } });
  if (!r.ok) throw new Error(`Space ${r.status}`);
  fallback = { at: Date.now(), body: await r.json() };
  return fallback.body;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  if (!req.user?.approved) return res.status(403).json({ error: "Account not approved" });
  next();
}

function requireSyncToken(req: Request, res: Response, next: NextFunction) {
  const want = process.env.SHOWZ_SYNC_TOKEN;
  if (!want) return res.status(503).json({ error: "sync disabled: SHOWZ_SYNC_TOKEN is not set" });
  const got = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got), b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: "bad token" });
  next();
}

const fail = (res: Response, e: any) => {
  if (e instanceof RevisionConflict) return res.status(409).json({ error: "changed since you last synced", rev: e.current });
  console.error("showz:", e);
  res.status(e?.status ?? 500).json({ error: e?.message ?? "failed" });
};

export function registerShowzRoutes(router: Router) {
  router.get("/api/showz", async (_req, res) => {
    try {
      const body = await publicShows();
      if (body) return res.json(body);
    } catch (e) {
      console.error("showz db read failed, using the Space copy:", e);
    }
    try {
      res.json(await fromSpace());
    } catch (e) {
      console.error("showz fetch failed:", e);
      if (fallback) return res.json(fallback.body);
      res.status(502).json({ error: "shows unavailable" });
    }
  });

  router.get("/api/admin/showz", requireAdmin, async (_req, res) => {
    try { res.json(await exportAll()); } catch (e) { fail(res, e); }
  });

  router.patch("/api/admin/showz/nights/:date", requireAdmin, async (req, res) => {
    try {
      const rev = await patchNight(req.params.date, req.body ?? {}, `web:${req.user?.username ?? "admin"}`);
      res.json({ ok: true, rev });
    } catch (e) { fail(res, e); }
  });

  router.get("/api/showz/sync", requireSyncToken, async (_req, res) => {
    try { res.json(await exportAll()); } catch (e) { fail(res, e); }
  });

  router.put("/api/showz/sync", requireSyncToken, async (req, res) => {
    const { rev, nights } = req.body ?? {};
    if (typeof rev !== "number" || !Array.isArray(nights)) return res.status(400).json({ error: "need {rev, nights}" });
    try { res.json({ ok: true, rev: await replaceAll(rev, nights, "namer") }); } catch (e) { fail(res, e); }
  });
}
