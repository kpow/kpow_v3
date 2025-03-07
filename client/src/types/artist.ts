import { z } from "zod";

// Define the schema for the Artist type
export const artistSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
  bio: z.string().optional(),
  playCount: z.number(),
  lastPlayed: z.string(),
  plays: z.array(z.object({
    id: z.string(),
    playedAt: z.string(),
    trackName: z.string()
  })).optional()
});

// Export the type
export type Artist = z.infer<typeof artistSchema>;
