import { pgTable, text, serial, integer, boolean, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Artists table to store unique artists and their images
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  imageUrl: text("image_url"),
});

// Songs table to store unique songs with their metadata
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  albumName: text("album_name"),
  containerAlbumName: text("container_album_name"),
  containerType: text("container_type"),
  mediaDurationMs: integer("media_duration_ms"),
  artistId: integer("artist_id").references(() => artists.id),
}, (table) => {
  return {
    uniqueSongPerArtist: unique("songs_name_artist_id_unique").on(table.name, table.artistId),
  };
});

// Plays table to store individual play events
export const plays = pgTable("plays", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").references(() => songs.id),
  startTimestamp: timestamp("start_timestamp").notNull(),
  endTimestamp: timestamp("end_timestamp").notNull(),
  playDurationMs: integer("play_duration_ms").notNull(),
  endPositionMs: integer("end_position_ms"),
  endReasonType: text("end_reason_type"),
  featureName: text("feature_name"),
  eventType: text("event_type"),
});

// Define relationships
export const artistsRelations = relations(artists, ({ many }) => ({
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  artist: one(artists, {
    fields: [songs.artistId],
    references: [artists.id],
  }),
  plays: many(plays),
}));

export const playsRelations = relations(plays, ({ one }) => ({
  song: one(songs, {
    fields: [plays.songId],
    references: [songs.id],
  }),
}));

// Export schemas
export const insertArtistSchema = createInsertSchema(artists);
export const selectArtistSchema = createSelectSchema(artists);
export type InsertArtist = typeof artists.$inferInsert;
export type SelectArtist = typeof artists.$inferSelect;

export const insertSongSchema = createInsertSchema(songs);
export const selectSongSchema = createSelectSchema(songs);
export type InsertSong = typeof songs.$inferInsert;
export type SelectSong = typeof songs.$inferSelect;

export const insertPlaySchema = createInsertSchema(plays);
export const selectPlaySchema = createSelectSchema(plays);
export type InsertPlay = typeof plays.$inferInsert;
export type SelectPlay = typeof plays.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;