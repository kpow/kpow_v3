import { z } from "zod";

export const recentTrackSchema = z.object({
  artist: z.object({
    "#text": z.string(),
    mbid: z.string().optional()
  }),
  name: z.string(),
  album: z.object({
    "#text": z.string(),
    mbid: z.string().optional()
  }),
  image: z.array(z.object({
    "#text": z.string(),
    size: z.string()
  })),
  date: z.object({
    uts: z.string(),
    "#text": z.string()
  }).optional()
});

export type RecentTrack = z.infer<typeof recentTrackSchema>;

export const recentTracksResponseSchema = z.object({
  recenttracks: z.object({
    track: z.array(recentTrackSchema),
    "@attr": z.object({
      user: z.string(),
      page: z.string(),
      perPage: z.string(),
      totalPages: z.string(),
      total: z.string()
    })
  })
});

export type RecentTracksResponse = z.infer<typeof recentTracksResponseSchema>;

export async function getRecentTracks(): Promise<RecentTrack[]> {
  const response = await fetch("/api/lastfm/recent-tracks");
  if (!response.ok) {
    throw new Error("Failed to fetch recent tracks");
  }
  const data = await response.json();
  const parsed = recentTracksResponseSchema.parse(data);
  return parsed.recenttracks.track;
}
