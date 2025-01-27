import { pgTable, text, serial, integer, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Venues table
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  capacity: integer("capacity"),
  firstShow: date("first_show"),
  lastShow: date("last_show"),
  totalShows: integer("total_shows").default(0),
});

// Shows table
export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  venueId: integer("venue_id").references(() => venues.id),
  rating: integer("rating"),
  notes: text("notes"),
});

// Songs table
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  debut: date("debut"),
  lastPlayed: date("last_played"),
  timesPlayed: integer("times_played").default(0),
  averageDuration: integer("average_duration"), // in seconds
  gap: integer("gap").default(0), // shows since last played
});

// Setlist items linking shows and songs
export const setlistItems = pgTable("setlist_items", {
  id: serial("id").primaryKey(),
  showId: integer("show_id").references(() => shows.id),
  songId: integer("song_id").references(() => songs.id),
  position: integer("position").notNull(), // Order in the setlist
  set: integer("set").notNull(), // Which set (1, 2, encore, etc)
  duration: integer("duration"), // in seconds
  segue: boolean("segue").default(false), // Whether it segues into next song
});

// Define relationships
export const showsRelations = relations(shows, ({ one, many }) => ({
  venue: one(venues, {
    fields: [shows.venueId],
    references: [venues.id],
  }),
  setlistItems: many(setlistItems),
}));

export const setlistItemsRelations = relations(setlistItems, ({ one }) => ({
  show: one(shows, {
    fields: [setlistItems.showId],
    references: [shows.id],
  }),
  song: one(songs, {
    fields: [setlistItems.songId],
    references: [songs.id],
  }),
}));

// Export schemas for validation
export const insertVenueSchema = createInsertSchema(venues);
export const insertShowSchema = createInsertSchema(shows);
export const insertSongSchema = createInsertSchema(songs);
export const insertSetlistItemSchema = createInsertSchema(setlistItems);

export type InsertVenue = typeof venues.$inferInsert;
export type InsertShow = typeof shows.$inferInsert;
export type InsertSong = typeof songs.$inferInsert;
export type InsertSetlistItem = typeof setlistItems.$inferInsert;

export type SelectVenue = typeof venues.$inferSelect;
export type SelectShow = typeof shows.$inferSelect;
export type SelectSong = typeof songs.$inferSelect;
export type SelectSetlistItem = typeof setlistItems.$inferSelect;