import type { NextFunction, Request, Response, Router } from "express";
import { PARTS, getPart, rebuild, status, type Part } from "../lib/phashboard";

// Phashboard data (see server/lib/phashboard). Public reads are cached in
// Postgres and refreshed in the background every 6 hours; an approved admin can
// force a rebuild from /admin/phashboard.

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  if (!req.user?.approved) return res.status(403).json({ error: "Account not approved" });
  next();
}

export function registerPhashboardRoutes(router: Router) {
  // Every Phish show on one month-day (MM-DD), flagged where koolyp was there.
  router.get("/api/phashboard/onthisday/:md", async (req, res) => {
    const md = req.params.md;
    if (!/^\d{2}-\d{2}$/.test(md)) return res.status(400).json({ error: "use MM-DD" });
    try {
      const body = await getPart("history");
      const rows = (body?.history || []).filter((h: { date: string }) => h.date.slice(5) === md);
      res.set("Cache-Control", "public, max-age=600").json({ shows: rows, built_at: body?.built_at });
    } catch (e) {
      console.error("[phashboard] onthisday:", e);
      res.status(503).json({ error: "phashboard data is not available yet" });
    }
  });

  router.get("/api/phashboard/:part", async (req, res) => {
    const part = req.params.part as Part;
    if (!PARTS.includes(part) || part === "history") return res.status(404).json({ error: "unknown part" });
    try {
      res.set("Cache-Control", "public, max-age=300").json(await getPart(part));
    } catch (e) {
      console.error(`[phashboard] ${part}:`, e);
      res.status(503).json({ error: "phashboard data is not available yet" });
    }
  });

  router.get("/api/admin/phashboard", requireAdmin, async (_req, res) => {
    res.json(await status());
  });

  router.post("/api/admin/phashboard/refresh", requireAdmin, async (_req, res) => {
    try {
      await rebuild();
      res.json(await status());
    } catch (e) {
      res.status(502).json({ error: (e as Error).message, ...(await status()) });
    }
  });
}
