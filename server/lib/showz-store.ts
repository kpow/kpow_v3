import { pool } from "@db";

// k-shows storage: the source of truth for show nights and clips.
//
//   showz_nights  one row per night (YYYY-MM-DD), venue/place, private notes
//   showz_clips   one row per clip, the band on stage, and whether its media is
//                 on the CDN yet (the namer uploads video; this only records it)
//   showz_meta    `rev`, bumped on every write, so the namer can refuse to
//                 overwrite edits it hasn't seen
//
// Two writers: the web admin (/admin/shows, one night at a time) and the namer
// on the Mac (whole-state sync, see replaceAll). Tables are created on first use
// with CREATE TABLE IF NOT EXISTS, like vizspot_pairings: do NOT run
// `npm run db:push`, which would also offer to drop the session table.

export interface StoreClip {
  id: string;
  file: string;
  artist: string;
  local_time: string | null;
  dur: number | null;
  w: number | null;
  h: number | null;
  published: boolean;
}

export interface StoreNight {
  night: string;
  dow: string;
  venue: string;
  city: string;
  lat: number | null;
  lon: number | null;
  venue_id: string;
  notes: string;
  reviewed: boolean;
  artist_candidates: string;
  time_conf: string;
  source: string;
  hidden: boolean;
  updated_at?: string;
  updated_by?: string;
  clips: StoreClip[];
}

export class RevisionConflict extends Error {
  constructor(public current: number) {
    super(`rev is ${current}`);
  }
}

let ready: Promise<void> | null = null;
export function ensureTables(): Promise<void> {
  if (!ready) {
    ready = pool
      .query(
        `CREATE TABLE IF NOT EXISTS showz_nights (
           night             varchar(10) PRIMARY KEY,
           dow               varchar(3)  NOT NULL DEFAULT '',
           venue             text        NOT NULL DEFAULT '',
           city              text        NOT NULL DEFAULT '',
           lat               double precision,
           lon               double precision,
           venue_id          text        NOT NULL DEFAULT '',
           notes             text        NOT NULL DEFAULT '',
           reviewed          boolean     NOT NULL DEFAULT false,
           artist_candidates text        NOT NULL DEFAULT '',
           time_conf         text        NOT NULL DEFAULT '',
           source            text        NOT NULL DEFAULT '',
           hidden            boolean     NOT NULL DEFAULT false,
           updated_at        timestamptz NOT NULL DEFAULT now(),
           updated_by        text        NOT NULL DEFAULT ''
         );
         CREATE TABLE IF NOT EXISTS showz_clips (
           id         text PRIMARY KEY,
           night      varchar(10) NOT NULL REFERENCES showz_nights(night) ON UPDATE CASCADE ON DELETE CASCADE,
           file       text    NOT NULL,
           artist     text    NOT NULL DEFAULT '',
           local_time text,
           dur        real,
           w          integer,
           h          integer,
           published  boolean NOT NULL DEFAULT false
         );
         CREATE INDEX IF NOT EXISTS showz_clips_night_idx ON showz_clips (night);
         CREATE TABLE IF NOT EXISTS showz_meta (key text PRIMARY KEY, value text NOT NULL);
         INSERT INTO showz_meta (key, value) VALUES ('rev', '0') ON CONFLICT (key) DO NOTHING;`,
      )
      .then(() => undefined)
      .catch((e) => {
        ready = null; // retry on the next request
        throw e;
      });
  }
  return ready;
}

// cache for the public /api/showz payload; any write clears it
let publicCache: { at: number; body: unknown } | null = null;
const bust = () => (publicCache = null);

export async function getRev(): Promise<number> {
  await ensureTables();
  const r = await pool.query(`SELECT value FROM showz_meta WHERE key = 'rev'`);
  return Number(r.rows[0]?.value ?? 0);
}

const clipOrder = (a: StoreClip, b: StoreClip) =>
  (a.local_time ?? a.file).localeCompare(b.local_time ?? b.file);

/** Every night with every clip (published or not), oldest first. */
export async function exportAll(): Promise<{ rev: number; nights: StoreNight[] }> {
  await ensureTables();
  const [rev, n, c] = await Promise.all([
    getRev(),
    pool.query(`SELECT * FROM showz_nights ORDER BY night`),
    pool.query(`SELECT * FROM showz_clips`),
  ]);
  const byNight = new Map<string, StoreClip[]>();
  for (const row of c.rows) {
    const list = byNight.get(row.night) ?? [];
    list.push({
      id: row.id, file: row.file, artist: row.artist, local_time: row.local_time,
      dur: row.dur, w: row.w, h: row.h, published: row.published,
    });
    byNight.set(row.night, list);
  }
  const nights = n.rows.map((r) => ({
    night: r.night, dow: r.dow, venue: r.venue, city: r.city, lat: r.lat, lon: r.lon,
    venue_id: r.venue_id, notes: r.notes, reviewed: r.reviewed,
    artist_candidates: r.artist_candidates, time_conf: r.time_conf, source: r.source,
    hidden: r.hidden, updated_at: r.updated_at?.toISOString?.() ?? r.updated_at, updated_by: r.updated_by,
    clips: (byNight.get(r.night) ?? []).sort(clipOrder),
  }));
  return { rev, nights };
}

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };

async function bumpRev(client: Q, expect?: number) {
  const r = await client.query(`SELECT value FROM showz_meta WHERE key = 'rev' FOR UPDATE`);
  const cur = Number(r.rows[0]?.value ?? 0);
  if (expect !== undefined && expect !== cur) throw new RevisionConflict(cur);
  await client.query(`UPDATE showz_meta SET value = $1 WHERE key = 'rev'`, [String(cur + 1)]);
  return cur + 1;
}

async function upsertNight(client: Q, n: StoreNight, by: string) {
  await client.query(
    `INSERT INTO showz_nights (night, dow, venue, city, lat, lon, venue_id, notes, reviewed,
       artist_candidates, time_conf, source, hidden, updated_at, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), $14)
     ON CONFLICT (night) DO UPDATE SET dow=$2, venue=$3, city=$4, lat=$5, lon=$6, venue_id=$7,
       notes=$8, reviewed=$9, artist_candidates=$10, time_conf=$11, source=$12, hidden=$13,
       updated_at = CASE WHEN (showz_nights.dow, showz_nights.venue, showz_nights.city, showz_nights.lat,
         showz_nights.lon, showz_nights.notes, showz_nights.reviewed, showz_nights.hidden)
         IS DISTINCT FROM ($2,$3,$4,$5,$6,$8,$9,$13) THEN now() ELSE showz_nights.updated_at END,
       updated_by = CASE WHEN (showz_nights.venue, showz_nights.city, showz_nights.notes, showz_nights.hidden)
         IS DISTINCT FROM ($3,$4,$8,$13) THEN $14 ELSE showz_nights.updated_by END`,
    [n.night, n.dow ?? "", n.venue ?? "", n.city ?? "", n.lat ?? null, n.lon ?? null, n.venue_id ?? "",
     n.notes ?? "", !!n.reviewed, n.artist_candidates ?? "", n.time_conf ?? "", n.source ?? "", !!n.hidden, by],
  );
}

/**
 * The namer's sync: make the tables exactly `nights`. Refuses (RevisionConflict)
 * unless `baseRev` is the current rev, i.e. the namer has seen every web edit.
 */
export async function replaceAll(baseRev: number, nights: StoreNight[], by = "namer"): Promise<number> {
  await ensureTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rev = await bumpRev(client, baseRev);
    for (const n of nights) await upsertNight(client, n, by);
    const dates = nights.map((n) => n.night);
    const ids = nights.flatMap((n) => n.clips.map((c) => c.id));
    await client.query(`DELETE FROM showz_clips WHERE NOT (id = ANY($1::text[]))`, [ids]);
    for (const n of nights)
      for (const c of n.clips)
        await client.query(
          `INSERT INTO showz_clips (id, night, file, artist, local_time, dur, w, h, published)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET night=$2, file=$3, artist=$4, local_time=$5, dur=$6, w=$7, h=$8, published=$9`,
          [c.id, n.night, c.file, c.artist ?? "", c.local_time, c.dur, c.w, c.h, !!c.published],
        );
    await client.query(`DELETE FROM showz_nights WHERE NOT (night = ANY($1::text[]))`, [dates]);
    await client.query("COMMIT");
    bust();
    return rev;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export interface NightPatch {
  venue?: string;
  city?: string;
  notes?: string;
  hidden?: boolean;
  /** move the whole night to another date (must be free) */
  date?: string;
  clips?: { id: string; artist: string }[];
}

/** One night from the web admin. Returns the new rev. */
export async function patchNight(date: string, p: NightPatch, by = "web"): Promise<number> {
  await ensureTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cur = await client.query(`SELECT night FROM showz_nights WHERE night = $1 FOR UPDATE`, [date]);
    if (!cur.rowCount) throw Object.assign(new Error("no such night"), { status: 404 });
    const rev = await bumpRev(client);
    const sets: string[] = [], vals: unknown[] = [];
    const set = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
    if (p.venue !== undefined) set("venue", p.venue.trim());
    if (p.city !== undefined) set("city", p.city.trim());
    if (p.notes !== undefined) set("notes", p.notes);
    if (p.hidden !== undefined) set("hidden", !!p.hidden);
    let target = date;
    if (p.date && p.date !== date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw Object.assign(new Error("bad date"), { status: 400 });
      const taken = await client.query(`SELECT 1 FROM showz_nights WHERE night = $1`, [p.date]);
      if (taken.rowCount) throw Object.assign(new Error(`${p.date} already has a night; merge them in the namer`), { status: 409 });
      set("night", p.date);
      set("dow", ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(p.date + "T12:00:00Z").getUTCDay()]);
      target = p.date;
    }
    set("updated_by", by);
    vals.push(date);
    await client.query(`UPDATE showz_nights SET ${sets.join(", ")}, updated_at = now() WHERE night = $${vals.length}`, vals);
    for (const c of p.clips ?? [])
      await client.query(`UPDATE showz_clips SET artist = $1 WHERE id = $2 AND night = $3`, [c.artist.trim(), c.id, target]);
    await client.query("COMMIT");
    bust();
    return rev;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

const CDN_BASE = process.env.SHOWZ_CDN_BASE || "https://kfiles.atl1.cdn.digitaloceanspaces.com/showz";

/**
 * What the public site shows: named, visible nights, published clips only.
 * Same shape as the old shows.json. `null` when the tables are still empty.
 */
export async function publicShows(): Promise<unknown | null> {
  if (publicCache && Date.now() - publicCache.at < 60_000) return publicCache.body;
  const { nights } = await exportAll();
  if (!nights.length) return null;
  const out = nights
    .filter((n) => !n.hidden)
    .map((n) => {
      const clips = n.clips.filter((c) => c.published);
      const artists = Array.from(new Set(clips.map((c) => c.artist).filter(Boolean)));
      return {
        date: n.night, dow: n.dow, artists, venue: n.venue, city: n.city, lat: n.lat, lon: n.lon,
        clips: clips.map((c) => ({
          id: c.id, artist: c.artist, time: (c.local_time ?? "").slice(11, 16),
          dur: c.dur ?? 0, w: c.w ?? 0, h: c.h ?? 0,
        })),
      };
    })
    .filter((n) => n.clips.length && n.artists.length && !n.artists.includes("(not a show)"))
    .sort((a, b) => b.date.localeCompare(a.date));
  const body = { generated: new Date().toISOString(), base: CDN_BASE, nights: out };
  publicCache = { at: Date.now(), body };
  return body;
}
