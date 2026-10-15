import { fetchLastFmData } from "../../utils/api-utils";
import { sameSong } from "./store";
import { albumArt, spotifyConnected, spotifyGet, type CurrentlyPlaying, type RecentlyPlayed, type SpotifyTrack } from "./spotify";
import { LASTFM_USER } from "./sync";

// The home page's "what I'm listening to": Last.fm (Apple Music scrobbles) and
// Spotify merged, newest first. A Spotify listen that was also scrobbled to Last.fm
// shows once, as the Spotify copy. Same shape the old Last.fm-only feed had.

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

const fromTrack = (t: SpotifyTrack, date: string | null, nowPlaying: boolean): RecentTrack => ({
  name: t.name,
  artist: t.artists.map((a) => a.name).join(", "),
  album: t.album.name,
  image: albumArt(t),
  url: t.external_urls.spotify ?? "",
  date,
  nowPlaying,
  source: "spotify",
});

async function fromSpotify(): Promise<RecentTrack[]> {
  if (!(await spotifyConnected())) return [];
  const [recent, now] = await Promise.all([
    spotifyGet<RecentlyPlayed>("/me/player/recently-played?limit=50"),
    spotifyGet<CurrentlyPlaying>("/me/player/currently-playing"),
  ]);
  const out = (recent?.items ?? [])
    .filter((i) => i.track?.type === "track")
    .map((i) => fromTrack(i.track, new Date(+new Date(i.played_at) - i.track.duration_ms).toISOString(), false));
  if (now?.is_playing && now.item?.type === "track") out.unshift(fromTrack(now.item, null, true));
  return out;
}

const firstArtist = (t: RecentTrack) => ({ artist: t.artist.split(", ")[0], track: t.name });

export async function recentTracks(): Promise<RecentTrack[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.tracks;
  const [lastfm, spotify] = await Promise.all([
    fromLastfm(),
    fromSpotify().catch((e) => {
      console.error("[music] recent spotify:", e.message);
      return [] as RecentTrack[];
    }),
  ]);
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
