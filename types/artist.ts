import { z } from "zod";

// Base artist schema that's shared between frontend and backend
export const artistSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl: z.string().optional(),
  artistImageUrl: z.string().optional(),
  bio: z.string().optional(),
  listeners: z.number().optional(),
  playcount: z.number().optional(),
  lastUpdated: z.string().optional(),
  playCount: z.number().optional(),
  lastPlayed: z.string().optional(),
  rank: z.number().optional(),
  plays: z.array(z.object({
    id: z.number(),
    startTimestamp: z.string(),
    songName: z.string()
  })).optional()
});

// Export the type
export type Artist = z.infer<typeof artistSchema>;

// Additional frontend-specific artist types
export interface ArtistDetails extends Artist {
  topTracks?: string[];
  similarArtists?: string[];
}

// Backend-specific artist types
export interface ArtistCreate extends Omit<Artist, 'id'> {
  // Fields required for creating new artist
}

export interface ArtistUpdate extends Partial<Artist> {
  id: number; // ID is required for updates
}
