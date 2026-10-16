import { createHash, randomBytes } from "crypto";
import { deleteSyncValue, getSyncValue, setSyncValue } from "./store";

// Spotify Web API as kpow: one refresh token, got once from /admin/music
// ("Connect Spotify") and kept in music_sync under 'spotify_auth'.
//
// Env: SPOTIFY_CLIENT_ID, the same Spotify app kpow's vizSpot board uses. Sign-in
// is PKCE like the vizSpot wizard, so no client secret. The app's redirect URIs
// must also list https://kpow.xyz/api/admin/spotify/callback (and
// http://127.0.0.1:<port>/api/admin/spotify/callback for dev: Spotify refuses
// "localhost"). SPOTIFY_REDIRECT_URI overrides the URI worked out from the request.

export const SPOTIFY_SCOPES = "user-read-recently-played user-read-currently-playing";

interface Auth {
  refresh_token: string;
  scope: string;
  connected_at: string;
}

let access: { token: string; expires: number } | null = null;

export const spotifyConfigured = () => !!process.env.SPOTIFY_CLIENT_ID;

export async function spotifyConnected(): Promise<Auth | null> {
  return spotifyConfigured() ? getSyncValue<Auth>("spotify_auth") : null;
}

// A PKCE verifier to keep in the session, and the authorize URL that goes with it.
export function authorizeUrl(redirectUri: string, state: string): { url: string; verifier: string } {
  const verifier = randomBytes(48).toString("base64url");
  const q = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    state,
  });
  return { url: `https://accounts.spotify.com/authorize?${q}`, verifier };
}

// The Spotify app is shared with the vizSpot board, kpow-dash and spotify-mcp, and a
// 429 can come with a Retry-After of hours (12 h on recently-played, Oct 2026).
// Calling through a block keeps it alive for all of them, so each endpoint's block
// is remembered (in music_sync, so a restart or deploy doesn't forget it) and that
// endpoint isn't called again until it's over.
export class SpotifyCooldown extends Error {
  constructor(public endpoint: string, public until: Date) {
    super(`spotify ${endpoint}: rate limited until ${until.toISOString()}`);
  }
}

const COOLDOWN_KEY = "spotify_cooldown";
const DEFAULT_RETRY_S = 5 * 60; // when a 429 has no usable Retry-After
let cooldowns: Promise<Record<string, number>> | null = null; // endpoint → until (ms)

function loadCooldowns(): Promise<Record<string, number>> {
  if (!cooldowns) {
    cooldowns = getSyncValue<Record<string, number>>(COOLDOWN_KEY).then(
      (v) => v ?? {},
      (e) => {
        cooldowns = null;
        throw e;
      },
    );
  }
  return cooldowns;
}

async function checkCooldown(endpoint: string): Promise<void> {
  const until = (await loadCooldowns())[endpoint] ?? 0;
  if (until > Date.now()) throw new SpotifyCooldown(endpoint, new Date(until));
}

async function startCooldown(endpoint: string, retryAfter: string | null): Promise<SpotifyCooldown> {
  const secs = Number(retryAfter);
  const date = retryAfter ? Date.parse(retryAfter) : NaN;
  const until =
    Number.isFinite(secs) && secs > 0 ? Date.now() + secs * 1000
    : date > Date.now() ? date
    : Date.now() + DEFAULT_RETRY_S * 1000;
  const all = await loadCooldowns();
  all[endpoint] = until;
  for (const [k, t] of Object.entries(all)) if (t <= Date.now()) delete all[k];
  await setSyncValue(COOLDOWN_KEY, all).catch((e) => console.error("[music] spotify cooldown save:", e.message));
  console.warn(`[music] spotify ${endpoint}: 429, Retry-After ${retryAfter ?? "none"}; not calling it until ${new Date(until).toISOString()}`);
  return new SpotifyCooldown(endpoint, new Date(until));
}

// Endpoints still blocked, for /admin/music.
export async function spotifyCooldowns(): Promise<Record<string, string>> {
  const all = await loadCooldowns().catch(() => ({}) as Record<string, number>);
  return Object.fromEntries(
    Object.entries(all)
      .filter(([, t]) => t > Date.now())
      .map(([k, t]) => [k, new Date(t).toISOString()]),
  );
}

async function token(body: Record<string, string>) {
  await checkCooldown("token");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, client_id: process.env.SPOTIFY_CLIENT_ID! }),
  });
  if (r.status === 429) throw await startCooldown("token", r.headers.get("retry-after"));
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`spotify token: ${r.status} ${data.error_description || data.error || ""}`.trim());
  return data as { access_token: string; expires_in: number; refresh_token?: string; scope: string };
}

export async function exchangeCode(code: string, redirectUri: string, verifier: string): Promise<void> {
  const t = await token({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: verifier });
  if (!t.refresh_token) throw new Error("spotify token: no refresh token");
  await setSyncValue("spotify_auth", { refresh_token: t.refresh_token, scope: t.scope, connected_at: new Date().toISOString() });
  access = { token: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 };
}

export async function disconnect(): Promise<void> {
  access = null;
  await deleteSyncValue("spotify_auth");
}

async function accessToken(): Promise<string> {
  if (access && access.expires > Date.now()) return access.token;
  const auth = await spotifyConnected();
  if (!auth) throw new Error("spotify not connected");
  const t = await token({ grant_type: "refresh_token", refresh_token: auth.refresh_token });
  // PKCE refresh tokens rotate: keep the new one, the old one stops working.
  if (t.refresh_token && t.refresh_token !== auth.refresh_token) {
    await setSyncValue("spotify_auth", { ...auth, refresh_token: t.refresh_token });
  }
  access = { token: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 };
  return access.token;
}

// GET a Web API path. null for 204 (e.g. nothing playing). Throws SpotifyCooldown,
// without calling Spotify, while that endpoint is rate limited.
export async function spotifyGet<T>(path: string): Promise<T | null> {
  const endpoint = path.split("?")[0];
  await checkCooldown(endpoint);
  const r = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (r.status === 204) return null;
  if (r.status === 401) access = null;
  if (r.status === 429) throw await startCooldown(endpoint, r.headers.get("retry-after"));
  if (!r.ok) throw new Error(`spotify ${endpoint}: ${r.status}`);
  return r.json() as Promise<T>;
}

export interface SpotifyTrack {
  id?: string;
  type: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { name: string; images: { url: string; width: number }[] };
  external_urls: { spotify?: string };
}

export interface RecentlyPlayed {
  items: { played_at: string; track: SpotifyTrack }[];
}

export interface CurrentlyPlaying {
  is_playing: boolean;
  currently_playing_type: string;
  item: SpotifyTrack | null;
}

// Album art closest to 300 px wide (Spotify lists 640, 300, 64).
export const albumArt = (t: SpotifyTrack) =>
  [...(t.album?.images ?? [])].sort((a, b) => Math.abs(a.width - 300) - Math.abs(b.width - 300))[0]?.url ?? "";
