import type { Router } from "express";

// vizBot firmware releases, trimmed from GitHub for /vizbot/releases.
//
//   GET /api/vizbot/releases  ->  VizbotRelease[] (newest first, drafts skipped)
//
// GitHub's unauthenticated limit is 60 requests an hour per IP, so the list is
// cached in memory for 15 minutes and a stale copy is served if GitHub fails.
// GITHUB_TOKEN is used when set (5000 an hour), but it's optional here.

const GITHUB_URL = "https://api.github.com/repos/kpow/vizpow/releases?per_page=30";
const TTL_MS = 15 * 60 * 1000;

export type VizbotBoard = "lcd169" | "lcd13" | "cores3" | "stackchan";

export interface VizbotAsset {
  name: string;
  size: number;
  url: string;
  board: VizbotBoard | null;
  kind: "ota" | "factory";
}

export interface VizbotRelease {
  tag: string;
  name: string;
  publishedAt: string | null;
  body: string;
  htmlUrl: string;
  prerelease: boolean;
  assets: VizbotAsset[];
}

// Filename token -> board. Order matters only for readability: no token is a
// substring of another ("esp32s3-lcd13" is not inside "esp32s3-lcd169").
// These are the firmware's BOARD_TYPE strings; the bot's update page refuses a
// file whose name doesn't contain its own token.
const BOARD_TOKENS: [string, VizbotBoard][] = [
  ["stackchan", "stackchan"],
  ["m5cores3", "cores3"],
  ["esp32s3-lcd169", "lcd169"],
  ["esp32s3-lcd13", "lcd13"],
];

function boardOf(name: string): VizbotBoard | null {
  const lower = name.toLowerCase();
  for (const [token, board] of BOARD_TOKENS) if (lower.includes(token)) return board;
  return null;
}

function trim(raw: any[]): VizbotRelease[] {
  return raw
    .filter((r) => r && !r.draft)
    .map((r) => ({
      tag: String(r.tag_name ?? ""),
      name: String(r.name ?? r.tag_name ?? ""),
      publishedAt: r.published_at ?? null,
      body: String(r.body ?? ""),
      htmlUrl: String(r.html_url ?? ""),
      prerelease: !!r.prerelease,
      assets: (Array.isArray(r.assets) ? r.assets : [])
        .filter((a: any) => typeof a?.name === "string" && !a.name.toLowerCase().includes("faces"))
        .map((a: any) => ({
          name: a.name as string,
          size: Number(a.size) || 0,
          url: String(a.browser_download_url ?? ""),
          board: boardOf(a.name),
          kind: a.name.toLowerCase().endsWith("-factory.bin") ? ("factory" as const) : ("ota" as const),
        })),
    }));
}

let cache: { data: VizbotRelease[]; at: number } | null = null;
let inflight: Promise<VizbotRelease[]> | null = null;

async function fetchReleases(): Promise<VizbotRelease[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "kpow.xyz-vizbot",
  };
  const token = process.env.GITHUB_TOKEN;
  const get = (auth: boolean) =>
    fetch(GITHUB_URL, {
      headers: auth && token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
      signal: AbortSignal.timeout(10_000),
    });

  let res = await get(true);
  if (token && res.status === 401) {
    // An expired or revoked token fails outright; the repo is public, so fall back.
    console.warn("[vizbot] GITHUB_TOKEN was rejected (401); retrying unauthenticated");
    res = await get(false);
  }
  if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("GitHub returned an unexpected shape");
  return trim(json);
}

export function registerVizbotRoutes(router: Router) {
  router.get("/api/vizbot/releases", async (_req, res) => {
    const fresh = cache && Date.now() - cache.at < TTL_MS;
    if (!fresh) {
      try {
        inflight ??= fetchReleases().finally(() => {
          inflight = null;
        });
        cache = { data: await inflight, at: Date.now() };
      } catch (error) {
        console.error("[vizbot] releases fetch failed:", (error as Error).message);
        if (!cache) {
          return res.status(502).json({ message: "Couldn't reach GitHub for vizBot releases" });
        }
        res.setHeader("X-Vizbot-Stale", "1"); // serve the last good copy
      }
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(cache!.data);
  });
}
