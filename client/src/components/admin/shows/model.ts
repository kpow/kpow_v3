// Types and derived views for /admin/shows. Data comes from GET /api/admin/showz
// (server/lib/showz-store.ts). Design: ~/projects/showz/comps/admin/option-c-stage.html

export const CDN = "https://kfiles.atl1.cdn.digitaloceanspaces.com/showz/clips";

export interface Clip {
  id: string;
  file: string;
  artist: string;
  local_time: string | null;
  dur: number | null;
  published: boolean;
}

export interface Night {
  night: string;
  dow: string;
  venue: string;
  city: string;
  notes: string;
  hidden: boolean;
  artist_candidates?: string;
  updated_at?: string;
  updated_by?: string;
  clips: Clip[];
}

/** What the editor changes; saved as a PATCH of the differences. */
export interface Draft {
  night: string;
  venue: string;
  city: string;
  notes: string;
  hidden: boolean;
  artists: string[];
}

export interface Patch {
  date?: string;
  venue?: string;
  city?: string;
  notes?: string;
  hidden?: boolean;
  clips?: { id: string; artist: string }[];
}

/** Band colours, tuned for zinc-950/900 surfaces. An empty band shows as the amber hatch (to do). */
export const BAND_COLORS = ["#60a5fa", "#c084fc", "#34d399", "#f472b6", "#fb923c", "#2dd4bf", "#a3e635", "#e879f9", "#facc15", "#f87171"];

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const dowOf = (d: string) => DOW[new Date(d + "T12:00:00").getDay()] ?? "";
export const hhmm = (c: Clip) => (c.local_time ?? "").slice(11, 16);
export const fmtDur = (s: number | null) => {
  const t = Math.round(s ?? 0);
  return t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : `${t}s`;
};
export const ago = (iso?: string) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const band = (c: Clip) => (c.artist ?? "").trim();
export const bandsOf = (n: Night) => Array.from(new Set(n.clips.map(band).filter(Boolean)));
export const isTodo = (n: Night) => n.clips.some((c) => !band(c));
export const isLive = (n: Night) => !n.hidden && n.clips.some((c) => c.published) && bandsOf(n).length > 0;
export const whyOff = (n: Night) =>
  n.hidden ? "hidden" : !n.clips.some((c) => c.published) ? "no published clips" : !bandsOf(n).length ? "no band yet" : "";

/** Consecutive runs of the same band. */
export function segments(n: Night) {
  const out: { artist: string; from: number; to: number; dur: number }[] = [];
  n.clips.forEach((c, i) => {
    const a = band(c), last = out[out.length - 1];
    if (last && last.artist === a) {
      last.to = i;
      last.dur += c.dur ?? 0;
    } else out.push({ artist: a, from: i, to: i, dur: c.dur ?? 0 });
  });
  return out;
}

/** Bands in stage order, with clip counts and minutes. */
export function lineup(n: Night) {
  const m = new Map<string, { artist: string; clips: number; dur: number }>();
  n.clips.forEach((c) => {
    const a = band(c);
    if (!a) return;
    const e = m.get(a) ?? { artist: a, clips: 0, dur: 0 };
    e.clips++;
    e.dur += c.dur ?? 0;
    m.set(a, e);
  });
  return Array.from(m.values());
}

export function bandColor(n: Night, artist: string) {
  if (!artist) return null;
  const i = lineup(n).findIndex((l) => l.artist === artist);
  return i < 0 ? null : BAND_COLORS[i % BAND_COLORS.length];
}

export type Filter = "all" | "todo" | "offsite" | "hidden";

export function matches(n: Night, q: string, filter: Filter) {
  if (filter === "todo" && !isTodo(n)) return false;
  if (filter === "offsite" && isLive(n)) return false;
  if (filter === "hidden" && !n.hidden) return false;
  const t = q.trim().toLowerCase();
  return !t || [n.night, n.dow, n.venue, n.city, n.notes, ...bandsOf(n)].join(" ").toLowerCase().includes(t);
}

export const counts = (list: Night[]) => ({
  all: list.length,
  todo: list.filter(isTodo).length,
  offsite: list.filter((n) => !isLive(n)).length,
  hidden: list.filter((n) => n.hidden).length,
});

/** This night's bands first, then the venue's likely acts, then the most-filmed bands. */
export function suggestions(n: Night, allArtists: string[]) {
  const cands = (n.artist_candidates ?? "")
    .split(";")
    .map((s) => s.split(" - ")[0].split(",")[0].replace(/\.$/, "").trim())
    .filter(Boolean);
  const out: string[] = [];
  const add = (a: string) => a && !out.includes(a) && out.push(a);
  bandsOf(n).forEach(add);
  cands.forEach(add);
  allArtists.slice(0, 12).forEach(add);
  return out;
}

export function describePatch(p: Patch) {
  const bits: string[] = [];
  if (p.date) bits.push(`moved to ${p.date}`);
  if (p.clips) bits.push(`${p.clips.length} clip band${p.clips.length === 1 ? "" : "s"}`);
  if ("venue" in p) bits.push("venue");
  if ("city" in p) bits.push("city");
  if ("hidden" in p) bits.push(p.hidden ? "hidden" : "shown on site");
  if ("notes" in p) bits.push("notes");
  return bits.join(", ");
}

export const toDraft = (n: Night): Draft => ({
  night: n.night, venue: n.venue, city: n.city, notes: n.notes, hidden: n.hidden, artists: n.clips.map((c) => c.artist),
});

/** The saved night with a draft laid over it, for rendering. */
export function view(n: Night, d?: Draft): Night {
  if (!d) return n;
  return {
    ...n, night: d.night, dow: dowOf(d.night), venue: d.venue, city: d.city, notes: d.notes, hidden: d.hidden,
    clips: n.clips.map((c, i) => ({ ...c, artist: d.artists[i] })),
  };
}

export function patchOf(n: Night, d?: Draft): Patch {
  const p: Patch = {};
  if (!d) return p;
  if (d.night !== n.night) p.date = d.night;
  if (d.venue !== n.venue) p.venue = d.venue;
  if (d.city !== n.city) p.city = d.city;
  if (d.notes !== n.notes) p.notes = d.notes;
  if (d.hidden !== n.hidden) p.hidden = d.hidden;
  const cl = n.clips
    .map((c, i) => ({ id: c.id, artist: (d.artists[i] ?? "").trim() }))
    .filter((c, i) => c.artist !== n.clips[i].artist);
  if (cl.length) p.clips = cl;
  return p;
}

/** The PATCH that puts a night back the way `before` was (the save toast's Undo). */
export function inversePatch(before: Night, after: Patch): Patch {
  const p: Patch = {};
  if (after.date) p.date = before.night;
  if ("venue" in after) p.venue = before.venue;
  if ("city" in after) p.city = before.city;
  if ("notes" in after) p.notes = before.notes;
  if ("hidden" in after) p.hidden = before.hidden;
  if (after.clips) p.clips = after.clips.map((c) => ({ id: c.id, artist: before.clips.find((b) => b.id === c.id)?.artist ?? "" }));
  return p;
}
