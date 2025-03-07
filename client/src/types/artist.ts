import { z } from "zod";

// Define the schema for the Artist type
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
  plays: z.array(z.object({
    id: z.number(),
    startTimestamp: z.string(),
    songName: z.string()
  })).optional()
});

// Export the type
export type Artist = z.infer<typeof artistSchema>;