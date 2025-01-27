import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Shows table to store attended shows
export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  showId: text("show_id").notNull().unique(), // Phish.net show ID
  date: date("date").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  rating: integer("rating"), // Optional user rating
});

// Songs table to store unique songs
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  times_played: integer("times_played").default(0),
  debut_date: date("debut_date"),
  last_played: date("last_played"),
});

// Setlists table to store setlist information
export const setlists = pgTable("setlists", {
  id: serial("id").primaryKey(),
  showId: text("show_id").notNull().references(() => shows.showId),
  notes: text("notes"),
  updated_at: timestamp("updated_at").defaultNow(),
});

// SetlistSongs to track songs in setlists
export const setlistSongs = pgTable("setlist_songs", {
  id: serial("id").primaryKey(),
  setlistId: integer("setlist_id").notNull().references(() => setlists.id),
  songId: integer("song_id").notNull().references(() => songs.id),
  set_number: integer("set_number").notNull(), // 1, 2, 3, E for encore
  position: integer("position").notNull(), // Position within the set
  transition: text("transition"), // Type of transition (>, ->, etc)
  notes: text("notes"), // Any notes about the performance
});

// Create schemas for validation
export const insertShowSchema = createInsertSchema(shows);
export const selectShowSchema = createSelectSchema(shows);
export const insertSongSchema = createInsertSchema(songs);
export const selectSongSchema = createSelectSchema(songs);
export const insertSetlistSchema = createInsertSchema(setlists);
export const selectSetlistSchema = createSelectSchema(setlists);
export const insertSetlistSongSchema = createInsertSchema(setlistSongs);
export const selectSetlistSongSchema = createSelectSchema(setlistSongs);

// Export types
export type Show = typeof shows.$inferSelect;
export type InsertShow = typeof shows.$inferInsert;
export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;
export type Setlist = typeof setlists.$inferSelect;
export type InsertSetlist = typeof setlists.$inferInsert;
export type SetlistSong = typeof setlistSongs.$inferSelect;
export type InsertSetlistSong = typeof setlistSongs.$inferInsert;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;