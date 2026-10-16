import { pool } from "@db";
import { fetchLastFmData } from "../../utils/api-utils";
import { ensureMusicTables, getSyncValue, recordScrobble, recordSpotifyPlay, setSyncValue, type RecordResult } from "./store";
import { SpotifyCooldown, albumArt, spotifyConfigured, spotifyConnected, spotifyCooldowns, spotifyGet, type RecentlyPlayed } from "./spotify";

// Pulls new plays into Postgres every 30 minutes: Spotify's recently-played first
// (it only remembers the last 50 tracks, so it must be polled), then krakap's
// Last.fm scrobbles (kept forever, so a missed run loses nothing). The first
// Last.fm run backfills everything since the Apple export ends (Feb 2025).
//
// 30 minutes, not less: the Spotify app is shared and rate limited (spotify.ts), and
// 50 tracks is ~3 hours of listening, so nothing is lost. While Spotify has
// recently-played blocked (a 429), spotifyGet skips the call until Retry-After.
//
// Runs in production; MUSIC_SYNC=on runs it in dev too, MUSIC_SYNC=off stops it.
// An advisory lock keeps two servers on the same database from syncing at once.

export const LASTFM_USER = process.env.LASTFM_USER || "krakap";
const EVERY_MS = 30 * 60_000;
const LOCK_KEY = 0x6d75_7369; // "musi"

interface SourceState {
  cursor: number | null; // Last.fm: unix s; Spotify: unix ms
  last_run: string | null;
  last_ok: string | null;
  last_error: string | null;
  last_counts: Record<RecordResult, number> | null;
}

const blank = (): SourceState => ({ cursor: null, last_run: null, last_ok: null, last_error: null, last_counts: null });
const counts = (): Record<RecordResult, number> => ({ inserted: 0, paired: 0, known: 0 });

let running: Promise<SyncReport> | null = null;

export interface SyncReport {
  spotify: SourceState | { skipped: string };
  lastfm: SourceState;
}

async function syncSpotify(c: import("pg").PoolClient): Promise<SourceState | { skipped: string }> {
  if (!(await spotifyConnected())) return { skipped: "not connected" };
  const st = { ...blank(), ...(await getSyncValue<SourceState>("spotify")), last_run: new Date().toISOString() };
  const n = counts();
  try {
    const q = st.cursor ? `after=${st.cursor}&limit=50` : "limit=50";
    const res = await spotifyGet<RecentlyPlayed>(`/me/player/recently-played?${q}`);
    const items = (res?.items ?? [])
      .filter((i) => i.track?.type === "track" && i.track.artists.length)
      .sort((a, b) => a.played_at.localeCompare(b.played_at));
    for (const i of items) {
      const playedAt = new Date(i.played_at);
      n[await recordSpotifyPlay(c, {
        playedAt,
        durationMs: i.track.duration_ms,
        artist: i.track.artists[0].name,
        track: i.track.name,
        album: i.track.album?.name ?? null,
        trackId: i.track.id ?? null,
        artists: i.track.artists.map((a) => a.name).join(", "),
        image: albumArt(i.track) || null,
        url: i.track.external_urls?.spotify ?? null,
      })]++;
      st.cursor = Math.max(st.cursor ?? 0, +playedAt);
    }
    st.last_ok = st.last_run;
    st.last_error = null;
  } catch (e) {
    st.last_error = (e as Error).message;
    if (e instanceof SpotifyCooldown) console.log(`[music] spotify sync: skipped, ${e.message}`);
    else console.error("[music] spotify sync:", e);
  }
  st.last_counts = n;
  await setSyncValue("spotify", st);
  return st;
}

interface LastFmTrack {
  name: string;
  artist: { "#text": string };
  album: { "#text": string };
  date?: { uts: string };
}

async function syncLastfm(c: import("pg").PoolClient): Promise<SourceState> {
  const st = { ...blank(), ...(await getSyncValue<SourceState>("lastfm")), last_run: new Date().toISOString() };
  const n = counts();
  try {
    if (st.cursor == null) {
      const r = await c.query("SELECT extract(epoch FROM max(start_timestamp))::bigint AS t FROM plays WHERE via = 'apple-export'");
      st.cursor = Number(r.rows[0]?.t ?? 0);
    }
    // Pages come newest first; gather them all, then store oldest first so the
    // cursor only moves past what's saved.
    const scrobbles: LastFmTrack[] = [];
    for (let page = 1, pages = 1; page <= pages; page++) {
      const params = { user: LASTFM_USER, from: String(st.cursor + 1), limit: "200", page: String(page) };
      // Last.fm throws the odd 5xx page; one retry saves waiting 15 minutes.
      const data = await fetchLastFmData("user.getrecenttracks", params).catch(async () => {
        await new Promise((r) => setTimeout(r, 3000));
        return fetchLastFmData("user.getrecenttracks", params);
      });
      pages = Number(data.recenttracks?.["@attr"]?.totalPages ?? 0);
      scrobbles.push(...(data.recenttracks?.track ?? []).filter((t: LastFmTrack) => t.date?.uts));
    }
    scrobbles.sort((a, b) => Number(a.date!.uts) - Number(b.date!.uts));
    for (const t of scrobbles) {
      const uts = Number(t.date!.uts);
      n[await recordScrobble(c, { uts, artist: t.artist["#text"], track: t.name, album: t.album["#text"] || null })]++;
      st.cursor = Math.max(st.cursor, uts);
    }
    st.last_ok = st.last_run;
    st.last_error = null;
  } catch (e) {
    st.last_error = (e as Error).message;
    console.error("[music] lastfm sync:", e);
  }
  st.last_counts = n;
  await setSyncValue("lastfm", st);
  return st;
}

async function runOnce(): Promise<SyncReport> {
  await ensureMusicTables();
  const c = await pool.connect();
  try {
    const got = await c.query("SELECT pg_try_advisory_lock($1) AS ok", [LOCK_KEY]);
    if (!got.rows[0].ok) throw new Error("another server is syncing");
    try {
      const spotify = await syncSpotify(c);
      const lastfm = await syncLastfm(c);
      const t = (s: SourceState | { skipped: string }) =>
        "skipped" in s ? s.skipped : s.last_error ?? JSON.stringify(s.last_counts);
      console.log(`[music] sync: spotify ${t(spotify)}; lastfm ${t(lastfm)}`);
      return { spotify, lastfm };
    } finally {
      await c.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
    }
  } finally {
    c.release();
  }
}

export function syncMusic(): Promise<SyncReport> {
  if (!running) running = runOnce().finally(() => (running = null));
  return running;
}

export async function musicStatus() {
  await ensureMusicTables();
  const auth = await spotifyConnected();
  const r = await pool.query(
    `SELECT source, via, count(*)::int AS n, max(start_timestamp) AS latest
       FROM plays WHERE start_timestamp > now() - interval '30 days' GROUP BY 1, 2 ORDER BY 1, 2`,
  );
  return {
    spotify: {
      configured: spotifyConfigured(),
      connected_at: auth?.connected_at ?? null,
      state: await getSyncValue<SourceState>("spotify"),
      rate_limited_until: await spotifyCooldowns(),
    },
    lastfm: { user: LASTFM_USER, state: await getSyncValue<SourceState>("lastfm") },
    syncing: !!running,
    last30: r.rows,
  };
}

export function startMusicSync() {
  const flag = process.env.MUSIC_SYNC;
  if (flag === "off" || (flag !== "on" && process.env.NODE_ENV !== "production")) return;
  const tick = () => syncMusic().catch((e) => console.error("[music] sync:", e.message));
  setTimeout(tick, 30_000);
  setInterval(tick, EVERY_MS);
}
