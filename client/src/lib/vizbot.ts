// vizBot releases from /api/vizbot/releases (server/routes/vizbot-routes.ts).
// Only 3.x and up counts as "current": the 2.x builds predate the touch UI and
// are listed as legacy.

import { useQuery } from "@tanstack/react-query";
import type { BoardId } from "@/content/vizbot";

export interface VizbotAsset {
  name: string;
  size: number;
  url: string;
  board: BoardId | null;
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

export type Semver = [number, number, number];

export function parseVersion(tag: string): Semver | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(tag.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

const cmp = (a: Semver, b: Semver) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export const versionOf = (r: VizbotRelease) => r.tag.replace(/^v/, "");

/** "v2.1.11 - OTA auto-update test target" -> "OTA auto-update test target" */
export function releaseTitle(r: VizbotRelease): string {
  const t = r.name.replace(new RegExp(`^\\s*v?${versionOf(r).replace(/\./g, "\\.")}\\s*[-–—:]?\\s*`), "");
  return t.trim();
}

export interface ReleaseSets {
  /** Newest non-prerelease with major >= 3, or null if none is published yet. */
  latest: VizbotRelease | null;
  /** Everything else, newest first. */
  older: VizbotRelease[];
}

export function splitReleases(all: VizbotRelease[] | undefined): ReleaseSets {
  const withV = (all ?? [])
    .map((r) => ({ r, v: parseVersion(r.tag) }))
    .filter((x): x is { r: VizbotRelease; v: Semver } => x.v !== null)
    .sort((a, b) => cmp(b.v, a.v));
  const cur = withV.find((x) => x.v[0] >= 3 && !x.r.prerelease) ?? null;
  return {
    latest: cur?.r ?? null,
    older: withV.filter((x) => x !== cur).map((x) => x.r),
  };
}

export const isLegacy = (r: VizbotRelease) => (parseVersion(r.tag)?.[0] ?? 0) < 3;

export function useVizbotReleases() {
  return useQuery<VizbotRelease[]>({
    queryKey: ["/api/vizbot/releases"],
    staleTime: 10 * 60 * 1000,
  });
}

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function assetFor(r: VizbotRelease | null, board: BoardId, kind: "ota" | "factory") {
  return r?.assets.find((a) => a.board === board && a.kind === kind) ?? null;
}

// Last board picked on the downloads page. Storage can throw (private mode, blocked).
const BOARD_KEY = "vizbot.board";
export function loadBoard(): string | null {
  try {
    return window.localStorage.getItem(BOARD_KEY);
  } catch {
    return null;
  }
}
export function saveBoard(id: BoardId) {
  try {
    window.localStorage.setItem(BOARD_KEY, id);
  } catch {
    /* ignore */
  }
}
