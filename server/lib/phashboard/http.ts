import { pool } from "@db";

// Phashboard storage. Two tables, created on first use (do NOT run db:push):
//
//   phashboard_http   one row per upstream URL: the trimmed JSON we got back and
//                     when. Old shows never change, so most rebuilds read here
//                     instead of hitting phish.in / phantasyfish.net again.
//   phashboard_cache  one row per built part (core, songs, shows, phantasy,
//                     history): what /api/phashboard/:part serves.

let ready: Promise<void> | null = null;
export function ensureTables(): Promise<void> {
  if (!ready) {
    ready = pool
      .query(
        `CREATE TABLE IF NOT EXISTS phashboard_http (
           url        text PRIMARY KEY,
           body       jsonb       NOT NULL,
           fetched_at timestamptz NOT NULL DEFAULT now()
         );
         CREATE TABLE IF NOT EXISTS phashboard_cache (
           part     text PRIMARY KEY,
           body     jsonb       NOT NULL,
           built_at timestamptz NOT NULL DEFAULT now()
         );`,
      )
      .then(() => undefined)
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

interface GetOpts<T> {
  /** Cache key when the URL carries a secret (the phish.net API key). */
  key?: string;
  /** Trim the response before it is stored. */
  pick?: (body: any) => T;
}

/**
 * GET a JSON URL through the phashboard_http cache. A row younger than
 * maxAgeMs is returned as is; otherwise the URL is fetched and stored. If the
 * fetch fails and an older row exists, that row is returned instead.
 */
export async function getJSON<T = any>(url: string, maxAgeMs: number, opts: GetOpts<T> = {}): Promise<T> {
  await ensureTables();
  const key = opts.key ?? url;
  const { rows } = await pool.query(
    `SELECT body, extract(epoch FROM now() - fetched_at) * 1000 AS age FROM phashboard_http WHERE url = $1`,
    [key],
  );
  const row = rows[0] as { body: T; age: number } | undefined;
  if (row && Number(row.age) < maxAgeMs) return row.body;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25_000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json", "user-agent": "kpow.xyz phashboard" } });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`${r.status} from ${key}`);
    const raw = await r.json();
    const body = opts.pick ? opts.pick(raw) : (raw as T);
    await pool.query(
      `INSERT INTO phashboard_http (url, body, fetched_at) VALUES ($1, $2, now())
       ON CONFLICT (url) DO UPDATE SET body = EXCLUDED.body, fetched_at = now()`,
      [key, JSON.stringify(body)],
    );
    return body;
  } catch (e) {
    if (row) {
      console.warn(`[phashboard] ${key}: ${(e as Error).message}; using copy from ${Math.round(Number(row.age) / HOUR)}h ago`);
      return row.body;
    }
    throw e;
  }
}

/** Run fn over items with at most `limit` in flight. */
export async function mapLimit<A, B>(items: A[], limit: number, fn: (a: A) => Promise<B>): Promise<B[]> {
  const out: B[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function savePart(part: string, body: unknown): Promise<void> {
  await ensureTables();
  await pool.query(
    `INSERT INTO phashboard_cache (part, body, built_at) VALUES ($1, $2, now())
     ON CONFLICT (part) DO UPDATE SET body = EXCLUDED.body, built_at = now()`,
    [part, JSON.stringify(body)],
  );
}

export async function loadPart(part: string): Promise<{ body: any; builtAt: Date } | null> {
  await ensureTables();
  const { rows } = await pool.query(`SELECT body, built_at FROM phashboard_cache WHERE part = $1`, [part]);
  return rows[0] ? { body: rows[0].body, builtAt: new Date(rows[0].built_at) } : null;
}
