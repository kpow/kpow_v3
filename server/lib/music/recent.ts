import { fetchLastFmData } from "../../utils/api-utils";
import { listPlays, nowPlaying, type Track } from "./plays";
import { sameSong } from "./store";
import { LASTFM_USER } from "./sync";

// The home page's "what I'm listening to": Last.fm (Apple Music scrobbles) and
// Spotify merged, newest first. A Spotify listen that was also scrobbled to Last.fm
// shows once, as the Spotify copy. Same shape the old Last.fm-only feed had.
//
// The Spotify half is the same data /api/music/plays serves (plays.ts): plays from
// Postgres plus the shared, cached currently-playing. No Spotify call of its own.

export interface RecentTrack {
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  date: string | null; // when the track started
  nowPlaying: boolean;
  source: "lastfm" | "spotify";
}

const CACHE_MS = 60_000;
const SAME_LISTEN_MS = 10 * 60_000;
let cache: { at: number; tracks: RecentTrack[] } | null = null;
let building: Promise<RecentTrack[]> | null = null;
// Each source's last good answer, used when it fails.
const lastGood: { lastfm: RecentTrack[]; plays: RecentTrack[] } = { lastfm: [], plays: [] };

async function fromLastfm(): Promise<RecentTrack[]> {
  const data = await fetchLastFmData("user.getrecenttracks", { user: LASTFM_USER, limit: "100", page: "1" });
  if (!data.recenttracks?.track) throw new Error("No tracks found in Last.fm response");
  return data.recenttracks.track.map((track: any) => ({
    name: track.name,
    artist: track.artist["#text"],
    album: track.album["#text"],
    image: track.image?.find((img: any) => img.size === "large")?.["#text"] ?? "",
    url: track.url,
    date: track.date?.uts ? new Date(Number(track.date.uts) * 1000).toISOString() : null,
    nowPlaying: !!track["@attr"]?.nowplaying,
    source: "lastfm" as const,
  }));
}

const toRecent = (t: Track): RecentTrack => ({
  name: t.name,
  artist: t.artist,
  album: t.album ?? "",
  image: t.image ?? "",
  url: t.url ?? `https://open.spotify.com/search/${encodeURIComponent(`${t.artist} ${t.name}`)}`,
  date: t.playedAt,
  nowPlaying: !t.playedAt,
  source: "spotify",
});

const fromPlays = async () => (await listPlays({ source: "spotify", limit: 50 })).map(toRecent);

async function soft(name: keyof typeof lastGood, get: () => Promise<RecentTrack[]>): Promise<RecentTrack[]> {
  try {
    return (lastGood[name] = await get());
  } catch (e) {
    console.error(`[music] recent ${name}:`, (e as Error).message);
    return lastGood[name];
  }
}

const firstArtist = (t: RecentTrack) => ({ artist: t.artist.split(", ")[0], track: t.name });

async function build(): Promise<RecentTrack[]> {
  const [lastfm, plays, now] = await Promise.all([soft("lastfm", fromLastfm), soft("plays", fromPlays), nowPlaying()]);
  const spotify = now ? [toRecent(now), ...plays] : plays;
  const near = (a: RecentTrack, b: RecentTrack) =>
    a.nowPlaying || b.nowPlaying
      ? a.nowPlaying && b.nowPlaying
      : Math.abs(+new Date(a.date!) - +new Date(b.date!)) <= SAME_LISTEN_MS;
  const extra = lastfm.filter((l) => !spotify.some((s) => near(s, l) && sameSong(firstArtist(s), firstArtist(l))));
  const when = (t: RecentTrack) => (t.nowPlaying ? Infinity : +new Date(t.date!));
  const tracks = [...spotify, ...extra].sort((a, b) => when(b) - when(a)).slice(0, 100);
  cache = { at: Date.now(), tracks };
  return tracks;
}

// Cached for CACHE_MS, always (a failed source falls back to its last good answer),
// and requests that arrive during a rebuild share it.
export function recentTracks(): Promise<RecentTrack[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return Promise.resolve(cache.tracks);
  if (!building) building = build().finally(() => (building = null));
  return building;
}
