// Build log data contract — mirrors what kpow-buildlog/scripts/build-buildlog.mjs
// emits. The file is staged into client/public at build time by
// scripts/sync-buildlog.mjs, so there is no API route and no database behind it.

import { useQuery } from "@tanstack/react-query";

export type BuildStatus = "active" | "shipped" | "shelved" | "live";

/** A still can declare what it is; video badges itself off the .mp4. */
export type MediaKind = "render" | "screenshot" | "diagram";

export interface BuildMedia {
  src: string;
  /** Optional on purpose: a caption carries a fact the photo can't, or it isn't there. */
  caption?: string;
  poster?: string;
  kind?: MediaKind;
}

export interface BuildEntry {
  date: string;
  title: string;
  tags: string[];
  body: string;
  media: BuildMedia[];
}

export interface BuildStats {
  entries: number;
  photos: number;
  daysActive: number;
  firstEntry: string;
  lastEntry: string;
}

export interface Build {
  slug: string;
  title: string;
  status: BuildStatus;
  kind: "hardware" | "software";
  summary: string;
  stack: string[];
  tags: string[];
  rung: string | null;
  facts: Record<string, string>;
  repo: string | null;
  hero: string | null;
  links: { label: string; url: string }[];
  started: string | null;
  body: string;
  stats: BuildStats;
  git: unknown | null;
  picturesOverTime: (BuildMedia & { date: string })[];
  lastEntry: string | null;
  entries: BuildEntry[];
}

export interface RecentEntry extends BuildEntry {
  build: string;
  buildTitle: string;
}

export interface BuildLog {
  builds: Build[];
  recent: RecentEntry[];
  generatedAt: string;
}

export function useBuildLog() {
  return useQuery<BuildLog>({
    queryKey: ["/builds.json"],
    staleTime: Infinity,
  });
}

/** "2026-05-27" -> "May 27 '26" — dates are plain strings, so parse them as
 *  local rather than letting Date() shift them a day in western timezones. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const month = new Date(y, m - 1, d).toLocaleString("en-US", { month: "short" });
  return `${month} ${String(d).padStart(2, "0")} '${String(y).slice(2)}`;
}

/** Same, without the year — for dense card footers. */
export function shortDateNoYear(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const month = new Date(y, m - 1, d).toLocaleString("en-US", { month: "short" });
  return `${month} ${String(d).padStart(2, "0")}`;
}
