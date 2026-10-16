import { pool } from "@db";
import { LISTEN_SQL, ensureMusicTables, getSyncValue } from "./store";
import { SpotifyCooldown, albumArt, spotifyConnected, spotifyCooldowns, spotifyGet, type CurrentlyPlaying } from "./spotify";

// kpow's listening, read from Postgres: GET /api/music/plays and the home feed
// (recent.ts). kpow-dash, kpow-mcp and spotify-mcp read /api/music/plays instead of
// calling Spotify, because the Spotify app is shared and rate limited (spotify.ts).
// Contract: ~/Library/Application Support/Claude/side-session-notes/…/music-plays-endpoint.md
//
// sync.ts is the only recently-played caller. The one live call here is
// currently-playing, at most once per NOW_PLAYING_MS for everyone.

export interface Track {
  trackId: string | null;
  name: string;
  artist: string; // all artists, joined with ", "
  album: string | null;
  image: string | null;
  url: string | null;
  playedAt: string | null; // when the track started; null only for nowPlaying
  durationMs: number;
  source: "spotify" | "apple";
}

export type PlaysSource = "spotify" | "apple" | "all";

export interface Listening {
  nowPlaying: Track | null;
  plays: Track[];
  syncedAt: string | null;
  spotifyCooldownUntil: string | null;
}

const NOW_PLAYING_MS = 2 * 60_000;
let nowCache: { at: number; track: Track | null } | null = null;
let nowFetch: Promise<Track | null> | null = null;

async function fetchNowPlaying(): Promise<Track | null> {
  let track: Track | null = null;
  try {
    if (await spotifyConnected()) {
      const now = await spotifyGet<CurrentlyPlaying>("/me/player/currently-playing");
      const t = now?.is_playing && now.item?.type === "track" ? now.item : null;
      if (t) {
        track = {
          trackId: t.id ?? null,
          name: t.name,
          artist: t.artists.map((a) => a.name).join(", "),
          album: t.album?.name ?? null,
          image: albumArt(t) || null,
          url: t.external_urls?.spotify ?? null,
          playedAt: null,
          durationMs: t.duration_ms,
          source: "spotify",
        };
      }
    }
  } catch (e) {
    if (!(e instanceof SpotifyCooldown)) console.error("[music] now playing:", (e as Error).message);
  }
  nowCache = { at: Date.now(), track };
  return track;
}

// What's on now. Cached even when the call fails, shared by concurrent requests,
// and no call at all while Spotify has currently-playing on a 429.
export function nowPlaying(): Promise<Track | null> {
  if (nowCache && Date.now() - nowCache.at < NOW_PLAYING_MS) return Promise.resolve(nowCache.track);
  if (!nowFetch) nowFetch = fetchNowPlaying().finally(() => (nowFetch = null));
  return nowFetch;
}

// Finished listens (LISTEN_SQL, so no Apple-export skips), newest first.
export async function listPlays(opts: { limit?: number; since?: Date | null; source?: PlaysSource } = {}): Promise<Track[]> {
  await ensureMusicTables();
  const params: unknown[] = [];
  const where = [LISTEN_SQL];
  if (opts.source && opts.source !== "all") {
    params.push(opts.source);
    where.push(`plays.source = $${params.length}`);
  }
  if (opts.since) {
    params.push(opts.since);
    where.push(`plays.start_timestamp >= $${params.length}`);
  }
  params.push(Math.min(Math.max(opts.limit ?? 50, 1), 200));
  const r = await pool.query(
    `SELECT plays.start_timestamp, plays.source,
            coalesce(nullif(plays.play_duration_ms, 0), s.media_duration_ms, 0) AS duration_ms,
            s.name, s.album_name, s.spotify_id, s.spotify_artists, s.image_url, s.spotify_url, a.name AS artist
       FROM plays JOIN songs s ON s.id = plays.song_id JOIN artists a ON a.id = s.artist_id
      WHERE ${where.join(" AND ")}
      ORDER BY plays.start_timestamp DESC LIMIT $${params.length}`,
    params,
  );
  return r.rows.map((row) => ({
    trackId: row.spotify_id ?? null,
    name: row.name,
    artist: row.spotify_artists ?? row.artist,
    album: row.album_name ?? null,
    image: row.image_url ?? null,
    url: row.spotify_url ?? null,
    playedAt: new Date(row.start_timestamp).toISOString(),
    durationMs: Number(row.duration_ms),
    source: row.source === "spotify" ? "spotify" : "apple",
  }));
}

// The latest a Spotify endpoint is blocked until, or null.
async function cooldownUntil(): Promise<string | null> {
  const until = Object.values(await spotifyCooldowns()).sort();
  return until.at(-1) ?? null;
}

export async function listening(opts: Parameters<typeof listPlays>[0] = {}): Promise<Listening> {
  const [now, plays, sync, cooldown] = await Promise.all([
    nowPlaying(),
    listPlays(opts),
    getSyncValue<{ last_ok: string | null }>("spotify"),
    cooldownUntil(),
  ]);
  return { nowPlaying: now, plays, syncedAt: sync?.last_ok ?? null, spotifyCooldownUntil: cooldown };
}
