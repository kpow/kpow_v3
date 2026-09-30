// Everything /shows derives from shows.json: per-night extras (year, venue key,
// miles from home), venue / artist / year roll-ups, and the records. A port of
// the comp's build-data.py (~/projects/showz/comps) so the page needs no extra
// file from the namer. ~150 nights, so this is cheap to do in the browser.

import type { ShowClip, ShowNight, ShowzData } from "@/lib/showz";

export const HOME = { name: "Richmond, VA", lat: 37.54198, lon: -77.43525 }; // The National

export interface Night extends ShowNight {
  year: number;
  /** venue string, or the city when the night has no named venue */
  venueKey: string;
  /** what the player footer shows */
  place: string;
  miles: number | null;
  minutes: number;
}

export interface Venue {
  key: string;
  name: string;
  named: boolean;
  city: string;
  lat: number;
  lon: number;
  nights: number;
  dates: string[];
}

export interface Artist {
  name: string;
  nights: number;
  clips: number;
  first: string;
}

export interface Year {
  year: number;
  nights: number;
  clips: number;
  venues: number;
  topArtist: string | null;
}

export interface ShowStats {
  base: string;
  nights: Night[]; // oldest first
  byDate: Record<string, Night>;
  venues: Venue[]; // most nights first
  venueByKey: Record<string, Venue>;
  artists: Artist[]; // most nights first
  years: Year[]; // every year first→last, empty ones included
  dow: number[]; // Mon..Sun
  months: number[]; // Jan..Dec
  totals: { nights: number; clips: number; hours: number; artists: number; venues: number; cities: number; first: string; last: string };
  records: {
    longestNight: Night;
    mostClipsNight: Night;
    farthestNight: Night;
    longestRun: Night[];
    longestGap: { days: number; from: Night; to: Night };
  };
  /** back-to-back nights at one venue: date -> "night i of n" */
  runs: Record<string, { i: number; of: number }>;
  /** year -> artists first seen that year */
  firsts: Record<number, string[]>;
}

/** "Shaw, DC US" -> "Shaw, DC"; Canadian/Mexican/French region codes get a readable tail. */
export function prettyCity(c: string) {
  return c
    .replace(/ US$/, "")
    .replace(/, 08 CA$/, ", ON")
    .replace(/, 23 MX$/, ", MX")
    .replace(/^Paris .*, 11 FR$/, "Paris, FR");
}

function miles(aLat: number, aLon: number, bLat: number, bLon: number) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((bLat - aLat) * r) / 2) ** 2 +
    Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLon - aLon) * r) / 2) ** 2;
  return Math.round(3958.8 * 2 * Math.asin(Math.sqrt(h)));
}

const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);

const clipArtists = (n: ShowNight, c: ShowClip) =>
  c.artist && !n.artists.includes(c.artist) ? c.artist.split(" + ") : [c.artist || n.artists[0]];

export function buildStats(data: ShowzData): ShowStats {
  const nights: Night[] = data.nights
    .filter((n) => n.clips.length)
    .map((n) => {
      const city = prettyCity(n.city || "");
      const venue = (n.venue || "").trim();
      return {
        ...n,
        city,
        year: +n.date.slice(0, 4),
        venueKey: venue || city,
        place: venue || city,
        miles: n.lat != null && n.lon != null ? miles(HOME.lat, HOME.lon, n.lat, n.lon) : null,
        minutes: n.clips.reduce((t, c) => t + c.dur, 0) / 60,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const byDate = Object.fromEntries(nights.map((n) => [n.date, n]));

  // venues
  const vmap = new Map<string, Venue>();
  for (const n of nights) {
    if (n.lat == null || n.lon == null) continue;
    let v = vmap.get(n.venueKey);
    if (!v) {
      v = { key: n.venueKey, name: n.venue || `somewhere in ${n.city}`, named: !!n.venue, city: n.city, lat: n.lat, lon: n.lon, nights: 0, dates: [] };
      vmap.set(n.venueKey, v);
    }
    v.nights++;
    v.dates.push(n.date);
  }
  const venues = Array.from(vmap.values()).sort((a, b) => b.nights - a.nights || a.name.localeCompare(b.name));

  // artists: nights from the night roll-up, clips from per-clip attribution
  const amap = new Map<string, Artist>();
  const artist = (name: string) => {
    let a = amap.get(name);
    if (!a) amap.set(name, (a = { name, nights: 0, clips: 0, first: "9999" }));
    return a;
  };
  for (const n of nights) {
    for (const name of n.artists) {
      const a = artist(name);
      a.nights++;
      if (n.date < a.first) a.first = n.date;
    }
    for (const c of n.clips) for (const name of clipArtists(n, c)) if (name) artist(name).clips++;
  }
  const artists = Array.from(amap.values())
    .filter((a) => a.nights)
    .sort((a, b) => b.nights - a.nights || b.clips - a.clips || a.name.localeCompare(b.name));

  // years, empty ones included so the gap shows
  const y0 = nights[0].year, y1 = nights[nights.length - 1].year;
  const years: Year[] = [];
  for (let y = y0; y <= y1; y++) {
    const ns = nights.filter((n) => n.year === y);
    const count = new Map<string, number>();
    ns.forEach((n) => n.artists.forEach((a) => count.set(a, (count.get(a) ?? 0) + 1)));
    const top = Array.from(count.entries()).sort((a, b) => b[1] - a[1])[0];
    years.push({
      year: y,
      nights: ns.length,
      clips: ns.reduce((t, n) => t + n.clips.length, 0),
      venues: new Set(ns.map((n) => n.venueKey)).size,
      topArtist: top ? top[0] : null,
    });
  }

  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dow = DOW.map((d) => nights.filter((n) => n.dow === d).length);
  const months = Array.from({ length: 12 }, (_, m) => nights.filter((n) => +n.date.slice(5, 7) === m + 1).length);

  // runs: consecutive days at the same venue
  const runs: ShowStats["runs"] = {};
  const runList: Night[][] = [];
  let cur = [nights[0]];
  const close = () => {
    if (cur.length > 1) {
      runList.push(cur);
      cur.forEach((n, i) => (runs[n.date] = { i: i + 1, of: cur.length }));
    }
  };
  for (let k = 1; k < nights.length; k++) {
    const a = nights[k - 1], b = nights[k];
    if (dayDiff(a.date, b.date) === 1 && a.venueKey === b.venueKey) cur.push(b);
    else {
      close();
      cur = [b];
    }
  }
  close();

  let gap = { days: 0, from: nights[0], to: nights[0] };
  for (let k = 1; k < nights.length; k++) {
    const d = dayDiff(nights[k - 1].date, nights[k].date);
    if (d > gap.days) gap = { days: d, from: nights[k - 1], to: nights[k] };
  }

  const firsts: Record<number, string[]> = {};
  artists.forEach((a) => (firsts[+a.first.slice(0, 4)] ||= []).push(a.name));

  const most = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((best, x) => (f(x) > f(best) ? x : best));
  const totalMin = nights.reduce((t, n) => t + n.minutes, 0);

  return {
    base: data.base,
    nights,
    byDate,
    venues,
    venueByKey: Object.fromEntries(venues.map((v) => [v.key, v])),
    artists,
    years,
    dow,
    months,
    totals: {
      nights: nights.length,
      clips: nights.reduce((t, n) => t + n.clips.length, 0),
      hours: Math.round((totalMin / 60) * 10) / 10,
      artists: artists.length,
      venues: new Set(nights.map((n) => n.venueKey)).size,
      cities: new Set(nights.map((n) => n.city)).size,
      first: nights[0].date,
      last: nights[nights.length - 1].date,
    },
    records: {
      longestNight: most(nights, (n) => n.minutes),
      mostClipsNight: most(nights, (n) => n.clips.length),
      farthestNight: most(nights, (n) => n.miles ?? 0),
      longestRun: runList.sort((a, b) => b.length - a.length)[0] ?? [],
      longestGap: gap,
    },
    runs,
    firsts,
  };
}

export const caption = (n: ShowNight) => n.artists.join(" + ");
export const shortPlace = (n: Night) => (n.venue ? n.venue.split(",")[0] : n.city);
export const venueLabel = (v: Venue) => (v.named ? v.name.split(",")[0] : v.name);
export const hasArtist = (n: Night, a: string) => n.artists.includes(a) || n.clips.some((c) => c.artist === a);
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
export const fmtNice = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const dayLabel = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
