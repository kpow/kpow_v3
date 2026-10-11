import { buildAll } from "./build";
import { loadPart, savePart, HOUR } from "./http";

// The page reads five parts so a phone only downloads the tab it opens:
//   core      overview + shared lookups (summary, shows, venues, years, PhantasyFish per show)
//   songs     song catalog vs seen, longest and rarest tracks
//   shows     every track of every attended show
//   phantasy  picks, real setlists, blind spots, tour race, standings
//   history   every Phish show (served filtered by /api/phashboard/onthisday)

export const PARTS = ["core", "songs", "shows", "phantasy", "history"] as const;
export type Part = (typeof PARTS)[number];
export const STALE_MS = 6 * HOUR;

let building: Promise<Record<Part, unknown>> | null = null;
let lastError: { at: string; message: string } | null = null;

function split(d: Awaited<ReturnType<typeof buildAll>>): Record<Part, unknown> {
  const seen = d.songs.filter((s) => s.seen > 0);
  const chase = d.songs.filter((s) => s.seen === 0 && s.original && !s.pseudo);
  const timed = d.tracks.filter((t) => t.minutes);
  const latest = d.shows[d.shows.length - 1];
  return {
    core: {
      summary: d.summary, pf_summary: d.pf_summary, years: d.years, venues: d.venues, shows: d.shows, pf_shows: d.pf_shows,
      top_songs: [...seen].sort((a, b) => b.seen - a.seen || a.song.localeCompare(b.song)).slice(0, 25),
      latest_tracks: latest ? d.tracks.filter((t) => t.date === latest.date) : [],
    },
    songs: {
      songs: [...seen, ...chase],
      longest: [...timed].sort((a, b) => b.minutes - a.minutes).slice(0, 20),
      rare: d.tracks.filter((t) => t.gap && t.gap >= 50).sort((a, b) => b.gap - a.gap).slice(0, 20),
    },
    shows: { tracks: d.tracks },
    phantasy: { pf_picks: d.pf_picks, pf_actual: d.pf_actual, pf_bias: d.pf_bias, pf_race: d.pf_race, pf_standings: d.pf_standings },
    history: { history: d.history },
  };
}

/** Rebuild every part. Concurrent callers share one build. */
export function rebuild(): Promise<Record<Part, unknown>> {
  if (!building) {
    const started = Date.now();
    building = (async () => {
      const parts = split(await buildAll());
      const builtAt = new Date().toISOString();
      for (const p of PARTS) await savePart(p, { ...(parts[p] as object), built_at: builtAt });
      console.log(`[phashboard] rebuilt in ${Math.round((Date.now() - started) / 1000)}s`);
      lastError = null;
      return parts;
    })()
      .catch((e) => {
        lastError = { at: new Date().toISOString(), message: (e as Error).message };
        console.error("[phashboard] rebuild failed:", e);
        throw e;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

/** A part from the cache; builds on first use, refreshes in the background when stale. */
export async function getPart(part: Part): Promise<any> {
  const hit = await loadPart(part);
  if (!hit) {
    await rebuild();
    return (await loadPart(part))?.body;
  }
  if (Date.now() - hit.builtAt.getTime() > STALE_MS) rebuild().catch(() => undefined);
  return hit.body;
}

export async function status() {
  const parts: Record<string, string | null> = {};
  for (const p of PARTS) parts[p] = (await loadPart(p))?.builtAt.toISOString() ?? null;
  return { parts, building: !!building, lastError };
}
