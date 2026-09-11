import express, { type Router, type Request, type Response } from "express";
import path from "path";
import { pool } from "@db";

// vizSpot phone pairing relay.
//
// A vizSpot LED board shows a QR code for https://kpow.xyz/vizspot/#<secret>.
// The phone wizard (client/public/vizspot/) and the board each derive a 24-hex
// id and an AES-256-GCM key from that secret. This relay only ever sees the id
// and ciphertext: it cannot read the Spotify credentials it carries.
//
//   POST /api/vizspot/pair/:id   board   upsert; optional {hint, ack}; returns a waiting payload once
//   GET  /api/vizspot/pair/:id   wizard  {state, board_age_s, hint, error}; marks the phone as present
//   PUT  /api/vizspot/pair/:id   wizard  {payload}: encrypted credentials for the board
//
// Rows live in Postgres (not memory) so any number of instances can serve it.
// The table is created on first use with CREATE TABLE IF NOT EXISTS: do NOT run
// `npm run db:push`, which would also offer to drop connect-pg-simple's session table.

const ID_RE = /^[0-9a-f]{24}$/;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const ACK_RE = /^(ok|err:[\x20-\x7e]{1,76})$/;
const MAX_BODY = 4096;
const ROW_CAP = 2000;

const WIZARD_DIR = path.join(process.cwd(), "client", "public", "vizspot");
const WIZARD_CSP =
  "default-src 'self'; connect-src 'self' https://accounts.spotify.com https://api.spotify.com; " +
  "img-src 'self' data: https://i.scdn.co; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'";

// --- storage -----------------------------------------------------------------

let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS vizspot_pairings (
           id            varchar(24) PRIMARY KEY,
           hint          text,
           payload       text,
           ack           varchar(80),
           board_seen_at timestamptz NOT NULL DEFAULT now(),
           phone_seen_at timestamptz,
           claimed_at    timestamptz,
           created_at    timestamptz NOT NULL DEFAULT now(),
           expires_at    timestamptz NOT NULL
         );
         CREATE INDEX IF NOT EXISTS vizspot_pairings_expires_idx ON vizspot_pairings (expires_at);`,
      )
      .then(() => undefined)
      .catch((e) => {
        tableReady = null; // retry on the next request
        throw e;
      });
  }
  return tableReady;
}

let lastCleanup = 0;
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  pool.query("DELETE FROM vizspot_pairings WHERE expires_at < now()").catch((e) => console.error("[vizspot] cleanup", e));
}

type Row = { hint: string | null; payload: string | null; ack: string | null; claimed_at: Date | null; board_seen_at: Date };

function stateOf(r: Row): "done" | "failed" | "checking" | "sent" | "waiting" {
  if (r.ack === "ok") return "done";
  if (r.ack) return "failed";
  if (r.claimed_at) return "checking";
  if (r.payload) return "sent";
  return "waiting";
}

// --- abuse limits (per instance; soft limits are fine in memory) --------------

type Bucket = { tokens: number; at: number };
const buckets = new Map<string, Bucket>();
// Token bucket: holds up to `capacity`, refills at `perMinute`. Capacity and rate
// are separate so a slow rate (20 per hour) still allows its first request.
function allow(key: string, capacity: number, perMinute: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, at: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.at) / 60_000) * perMinute);
  b.at = now;
  const ok = b.tokens >= 1;
  if (ok) b.tokens -= 1;
  buckets.set(key, b);
  return ok;
}
setInterval(() => {
  const cutoff = Date.now() - 10 * 60_000;
  buckets.forEach((b, k) => { if (b.at < cutoff) buckets.delete(k); });
}, 5 * 60_000).unref();

const clientIp = (req: Request) => (req.headers["cf-connecting-ip"] as string) || req.ip || "unknown";

// Common guard: no caching, bounded body, valid id. Returns the id or null (response sent).
function guard(req: Request, res: Response): string | null {
  res.set("Cache-Control", "no-store");
  if (Number(req.headers["content-length"] || 0) > MAX_BODY) {
    res.status(413).json({ error: "too large" });
    return null;
  }
  const { id } = req.params;
  if (!ID_RE.test(id)) {
    res.status(400).json({ error: "bad id" });
    return null;
  }
  return id;
}

const fail500 = (res: Response, where: string) => (e: unknown) => {
  console.error(`[vizspot] ${where}`, e);
  if (!res.headersSent) res.status(500).json({ error: "server error" });
};

// --- routes --------------------------------------------------------------------

export function registerVizspotRoutes(router: Router) {
  // Phone wizard (static). Same pattern as /cube.
  router.use(
    "/vizspot",
    express.static(WIZARD_DIR, {
      setHeaders: (res, filePath) => {
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Referrer-Policy", "no-referrer");
        if (filePath.endsWith(".html")) res.setHeader("Content-Security-Policy", WIZARD_CSP);
      },
    }),
  );

  // Board: check in, optionally leave a hint or acknowledge, collect credentials.
  router.post("/api/vizspot/pair/:id", (req, res) => {
    const id = guard(req, res);
    if (!id) return;
    const ip = clientIp(req);
    if (!allow(`post:${ip}`, 40, 40)) return res.status(429).json({ error: "slow down" });
    const hint = req.body?.hint;
    const ack = req.body?.ack;
    if (hint !== undefined && (typeof hint !== "string" || hint.length < 40 || hint.length > 256 || !B64_RE.test(hint)))
      return res.status(400).json({ error: "bad hint" });
    if (ack !== undefined && (typeof ack !== "string" || !ACK_RE.test(ack)))
      return res.status(400).json({ error: "bad ack" });

    (async () => {
      await ensureTable();
      maybeCleanup();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const live = await client.query("SELECT 1 FROM vizspot_pairings WHERE id = $1 AND expires_at > now()", [id]);
        if (live.rowCount === 0) {
          if (!allow(`new:${ip}`, 20, 20 / 60)) {
            await client.query("ROLLBACK");
            return res.status(429).json({ error: "too many new codes" });
          }
          const n = await client.query("SELECT count(*)::int AS n FROM vizspot_pairings WHERE expires_at > now()");
          if (n.rows[0].n >= ROW_CAP) {
            await client.query("ROLLBACK");
            return res.status(503).json({ error: "relay full" });
          }
          await client.query("DELETE FROM vizspot_pairings WHERE id = $1", [id]); // stale expired row
        }
        await client.query(
          `INSERT INTO vizspot_pairings (id, hint, expires_at) VALUES ($1, $2, now() + interval '20 minutes')
           ON CONFLICT (id) DO UPDATE SET
             board_seen_at = now(),
             hint = COALESCE(EXCLUDED.hint, vizspot_pairings.hint),
             expires_at = GREATEST(vizspot_pairings.expires_at, now() + interval '20 minutes')`,
          [id, hint ?? null],
        );
        if (ack)
          await client.query(
            `UPDATE vizspot_pairings SET ack = $2, expires_at = now() + interval '10 minutes'
             WHERE id = $1 AND claimed_at IS NOT NULL`,
            [id, ack],
          );
        const row = (await client.query("SELECT payload, phone_seen_at FROM vizspot_pairings WHERE id = $1 FOR UPDATE", [id]))
          .rows[0];
        let payload: string | null = null;
        if (row?.payload) {
          payload = row.payload;
          await client.query("UPDATE vizspot_pairings SET payload = NULL, claimed_at = now(), ack = NULL WHERE id = $1", [id]);
        }
        await client.query("COMMIT");
        const fast = !!row?.phone_seen_at && Date.now() - new Date(row.phone_seen_at).getTime() < 10 * 60_000;
        res.json({ payload, fast });
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    })().catch(fail500(res, "post"));
  });

  // Wizard: status, hint, and "a phone is here" (the board then polls fast).
  router.get("/api/vizspot/pair/:id", (req, res) => {
    const id = guard(req, res);
    if (!id) return;
    if (!allow(`get:${clientIp(req)}`, 40, 40)) return res.status(429).json({ error: "slow down" });
    (async () => {
      await ensureTable();
      maybeCleanup();
      const r = await pool.query(
        `UPDATE vizspot_pairings SET phone_seen_at = now() WHERE id = $1 AND expires_at > now()
         RETURNING hint, payload, ack, claimed_at, board_seen_at`,
        [id],
      );
      if (r.rowCount === 0) return res.status(404).json({ error: "unknown or expired" });
      const row = r.rows[0] as Row;
      const state = stateOf(row);
      res.json({
        state,
        board_age_s: Math.round((Date.now() - new Date(row.board_seen_at).getTime()) / 1000),
        hint: row.hint ?? null,
        error: state === "failed" ? String(row.ack).replace(/^err:/, "") : null,
      });
    })().catch(fail500(res, "get"));
  });

  // Wizard: hand over encrypted credentials. Clears any previous claim/ack so
  // "try again" after a failure works without rescanning.
  router.put("/api/vizspot/pair/:id", (req, res) => {
    const id = guard(req, res);
    if (!id) return;
    if (!allow(`put:${clientIp(req)}`, 10, 10)) return res.status(429).json({ error: "slow down" });
    const payload = req.body?.payload;
    if (typeof payload !== "string" || payload.length < 40 || payload.length > 1024 || !B64_RE.test(payload))
      return res.status(400).json({ error: "bad payload" });
    (async () => {
      await ensureTable();
      maybeCleanup();
      const r = await pool.query(
        `UPDATE vizspot_pairings
         SET payload = $2, claimed_at = NULL, ack = NULL, phone_seen_at = now(),
             expires_at = GREATEST(expires_at, now() + interval '20 minutes')
         WHERE id = $1 AND expires_at > now() AND ack IS DISTINCT FROM 'ok'
         RETURNING id`,
        [id, payload],
      );
      if (r.rowCount === 0) {
        const done = await pool.query("SELECT 1 FROM vizspot_pairings WHERE id = $1 AND expires_at > now() AND ack = 'ok'", [id]);
        return done.rowCount
          ? res.status(409).json({ error: "already connected" })
          : res.status(404).json({ error: "unknown or expired" });
      }
      res.json({ state: "sent" });
    })().catch(fail500(res, "put"));
  });
}
