// k-shows data contract — mirrors what ~/projects/showz/namer/publish.mjs
// writes to kfiles/showz/shows.json. Served through /api/showz.
//
// The home-page k-shows carousel was the Instagram feed; it keeps that exact
// look, so each night is handed to it as an Instagram-style album post:
// one post per night, one VIDEO child per clip.

import { useQuery } from "@tanstack/react-query";

export interface ShowClip {
  id: string;
  artist: string;
  /** local time the clip was shot, "HH:MM" */
  time: string;
  dur: number;
  w: number;
  h: number;
}

export interface ShowNight {
  /** YYYY-MM-DD */
  date: string;
  dow: string;
  artists: string[];
  venue: string;
  city: string;
  lat: number | null;
  lon: number | null;
  clips: ShowClip[];
}

export interface ShowzData {
  generated: string;
  base: string;
  nights: ShowNight[];
}

export interface ShowMediaChild {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url: string;
  thumbnail_url?: string;
  /** who's on stage in this clip */
  artist?: string;
}

export interface ShowPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  location?: { id: string; name: string };
  children?: { data: ShowMediaChild[] };
}

/** "St. Augustine Amphitheatre, St. Augustine FL" stays whole; falls back to the city. */
const place = (n: ShowNight) => n.venue || (n.city || "").replace(/ US$/, "");

export function toPosts(data: ShowzData): ShowPost[] {
  return data.nights.map((n) => nightToPost(data.base, n));
}

/** One night as an album post, for ShowCard / ShowModal (home carousel and /shows). */
export function nightToPost(base: string, n: ShowNight): ShowPost {
  // the middle clip is usually the best-lit cover
  const cover = n.clips[Math.floor(n.clips.length / 2)];
  return {
    id: n.date,
    media_type: "CAROUSEL_ALBUM",
    media_url: `${base}/clips/${cover.id}.jpg`,
    caption: n.artists.join(" + "),
    // noon, so the date never slips a day in US time zones
    timestamp: `${n.date}T12:00:00`,
    location: place(n) ? { id: place(n), name: place(n) } : undefined,
    children: {
      data: n.clips.map((c) => ({
        id: c.id,
        media_type: "VIDEO" as const,
        media_url: `${base}/clips/${c.id}.mp4`,
        // full-size still for the player; cards keep the small .jpg
        thumbnail_url: `${base}/clips/${c.id}.full.jpg`,
        artist: c.artist,
      })),
    },
  };
}

export function useShowz() {
  return useQuery<ShowzData>({
    queryKey: ["showz"],
    queryFn: async () => {
      const r = await fetch("/api/showz");
      if (!r.ok) throw new Error("Failed to fetch shows");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
