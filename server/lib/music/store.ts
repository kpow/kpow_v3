import { pool } from "@db";
import type { PoolClient } from "pg";

// Music plays from every source, merged into the one `plays` table that /itunez reads.
//
//   source  where the listen happened: 'apple' | 'spotify'
//   via     how it got here:
//             'apple-export'    Apple privacy export (2016 → Feb 2025). Includes skips,
//                               so a play counts as a listen only at >= 30 s.
//             'lastfm'          a krakap scrobble. Last.fm only scrobbles real listens.
//                               Taken as Apple unless the Spotify poller claims it.
//             'spotify-api'     Spotify's recently-played (a listen of >= 30 s).
//   external_key  'spotify:<played_at>' for Spotify rows, unique
//   lastfm_uts    the scrobble's timestamp, unique, so a re-poll never doubles it
//
// One listen can arrive twice: as a Spotify play and as a Spotify→Last.fm scrobble.
// The two are paired when artist + track match within PAIR_WINDOW; the Spotify row wins
// and keeps the scrobble's lastfm_uts.
//
// The columns are added on first use (ALTER … IF NOT EXISTS) and are not in
// db/schema.ts: do NOT run `npm run db:push`.

export type Via = "apple-export" | "lastfm" | "spotify-api";

// SQL for "this play counts as a listen", for queries over `plays`.
export const LISTEN_SQL = "(plays.via IN ('lastfm', 'spotify-api') OR plays.play_duration_ms >= 30000)";

const PAIR_WINDOW_MS = 10 * 60_000;

let ready: Promise<void> | null = null;
export function ensureMusicTables(): Promise<void> {
  if (!ready) {
    ready = pool
      .query(
        `ALTER TABLE plays ADD COLUMN IF NOT EXISTS source text;
         ALTER TABLE plays ADD COLUMN IF NOT EXISTS via text;
         ALTER TABLE plays ADD COLUMN IF NOT EXISTS external_key text;
         ALTER TABLE plays ADD COLUMN IF NOT EXISTS lastfm_uts bigint;
         CREATE UNIQUE INDEX IF NOT EXISTS plays_external_key_uq ON plays (external_key);
         CREATE UNIQUE INDEX IF NOT EXISTS plays_lastfm_uts_uq ON plays (lastfm_uts);
         CREATE INDEX IF NOT EXISTS plays_start_timestamp_idx ON plays (start_timestamp);
         UPDATE plays SET source = 'apple', via = 'apple-export' WHERE via IS NULL;
         CREATE TABLE IF NOT EXISTS music_sync (
           key        text PRIMARY KEY,
           value      jsonb NOT NULL,
           updated_at timestamptz NOT NULL DEFAULT now()
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

export async function getSyncValue<T>(key: string): Promise<T | null> {
  await ensureMusicTables();
  const r = await pool.query("SELECT value FROM music_sync WHERE key = $1", [key]);
  return r.rows[0]?.value ?? null;
}

export async function setSyncValue(key: string, value: unknown): Promise<void> {
  await ensureMusicTables();
  await pool.query(
    `INSERT INTO music_sync (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export async function deleteSyncValue(key: string): Promise<void> {
  await ensureMusicTables();
  await pool.query("DELETE FROM music_sync WHERE key = $1", [key]);
}

// "The Beatles" / "Hey Jude - Remastered 2015" → "beatles" / "hey jude": enough to tell
// that Spotify's and Last.fm's copy of one listen are the same song.
export function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+-\s+.*$/, "")
    .replace(/[([].*?[)\]]/g, "")
    .replace(/\b(feat|ft)\.?\s.*$/, "")
    .replace(/&/g, " and ")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sameSong(a: { artist: string; track: string }, b: { artist: string; track: string }): boolean {
  if (norm(a.track) !== norm(b.track)) return false;
  const x = norm(a.artist), y = norm(b.artist);
  return x === y || x.startsWith(y + " ") || y.startsWith(x + " ");
}

async function artistId(c: PoolClient, name: string): Promise<number> {
  const found = await c.query("SELECT id FROM artists WHERE lower(name) = lower($1) ORDER BY id LIMIT 1", [name]);
  if (found.rows[0]) return found.rows[0].id;
  const r = await c.query(
    `INSERT INTO artists (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [name],
  );
  return r.rows[0].id;
}

async function songId(c: PoolClient, artist: number, name: string, album: string | null, durationMs: number | null): Promise<number> {
  const found = await c.query(
    "SELECT id FROM songs WHERE artist_id = $1 AND lower(name) = lower($2) ORDER BY id LIMIT 1",
    [artist, name],
  );
  if (found.rows[0]) return found.rows[0].id;
  const r = await c.query(
    `INSERT INTO songs (name, album_name, media_duration_ms, artist_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT ON CONSTRAINT songs_name_artist_id_unique DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [name, album, durationMs, artist],
  );
  return r.rows[0].id;
}

// Rows of the other kind near `at` that aren't already paired, nearest first.
async function candidates(c: PoolClient, wantVia: Via, from: Date, to: Date, unpairedSql: string) {
  const r = await c.query(
    `SELECT p.id, p.start_timestamp, a.name AS artist, s.name AS track
       FROM plays p JOIN songs s ON s.id = p.song_id JOIN artists a ON a.id = s.artist_id
      WHERE p.via = $1 AND p.start_timestamp BETWEEN $2 AND $3 AND ${unpairedSql}`,
    [wantVia, from, to],
  );
  return r.rows as { id: number; start_timestamp: Date; artist: string; track: string }[];
}

const nearest = <T extends { start_timestamp: Date }>(rows: T[], at: Date) =>
  rows.sort((a, b) => Math.abs(+a.start_timestamp - +at) - Math.abs(+b.start_timestamp - +at))[0];

export interface Scrobble {
  uts: number; // seconds; Last.fm stamps a scrobble with the time the track started
  artist: string;
  track: string;
  album: string | null;
}

export type RecordResult = "inserted" | "paired" | "known";

// One Last.fm scrobble. Pairs with a Spotify play of the same listen if there is one,
// else it's stored as an Apple play.
export async function recordScrobble(c: PoolClient, s: Scrobble): Promise<RecordResult> {
  const known = await c.query("SELECT 1 FROM plays WHERE lastfm_uts = $1", [s.uts]);
  if (known.rowCount) return "known";

  const at = new Date(s.uts * 1000);
  const rows = (
    await candidates(c, "spotify-api", new Date(+at - PAIR_WINDOW_MS), new Date(+at + PAIR_WINDOW_MS), "p.lastfm_uts IS NULL")
  ).filter((r) => sameSong(r, s));
  if (rows.length) {
    await c.query("UPDATE plays SET lastfm_uts = $2 WHERE id = $1", [nearest(rows, at).id, s.uts]);
    return "paired";
  }

  const song = await songId(c, await artistId(c, s.artist), s.track, s.album, null);
  await c.query(
    `INSERT INTO plays (song_id, start_timestamp, end_timestamp, play_duration_ms, source, via, lastfm_uts)
     VALUES ($1, $2, $2, 0, 'apple', 'lastfm', $3)`,
    [song, at, s.uts],
  );
  return "inserted";
}

export interface SpotifyPlay {
  playedAt: Date; // Spotify's played_at, taken as the moment the track ended
  durationMs: number;
  artist: string;
  track: string;
  album: string | null;
}

// One Spotify recently-played item. Claims the matching Last.fm scrobble (stored as
// Apple until now) if there is one, else adds a new Spotify play.
export async function recordSpotifyPlay(c: PoolClient, p: SpotifyPlay): Promise<RecordResult> {
  const key = `spotify:${p.playedAt.toISOString()}`;
  const known = await c.query("SELECT 1 FROM plays WHERE external_key = $1", [key]);
  if (known.rowCount) return "known";

  const start = new Date(+p.playedAt - p.durationMs);
  const rows = (
    await candidates(c, "lastfm", new Date(+start - PAIR_WINDOW_MS), new Date(+p.playedAt + PAIR_WINDOW_MS), "true")
  ).filter((r) => sameSong(r, p));
  if (rows.length) {
    await c.query(
      `UPDATE plays SET source = 'spotify', via = 'spotify-api', external_key = $2,
              start_timestamp = $3, end_timestamp = $4, play_duration_ms = $5
        WHERE id = $1`,
      [nearest(rows, start).id, key, start, p.playedAt, p.durationMs],
    );
    return "paired";
  }

  const song = await songId(c, await artistId(c, p.artist), p.track, p.album, p.durationMs);
  await c.query(
    `INSERT INTO plays (song_id, start_timestamp, end_timestamp, play_duration_ms, source, via, external_key)
     VALUES ($1, $2, $3, $4, 'spotify', 'spotify-api', $5)`,
    [song, start, p.playedAt, p.durationMs, key],
  );
  return "inserted";
}
