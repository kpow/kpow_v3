import { z } from "zod";

// Define the schema for the Artist type
export const artistSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl: z.string().optional(),
  artistImageUrl: z.string().optional(),
  bio: z.string().optional(),
  playCount: z.number(),
  lastPlayed: z.string(),
  plays: z.array(z.object({
    id: z.number(),
    startTimestamp: z.string(),
    songName: z.string()
  })).optional()
});

// Export the type
export type Artist = z.infer<typeof artistSchema>;