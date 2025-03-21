import { pgTable, text, serial, integer, boolean, timestamp, varchar, unique, jsonb, primaryKey, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { Artist, ArtistInsert, Song, SongInsert, Play, PlayInsert, Book, BookInsert, Author, AuthorInsert, Shelf, ShelfInsert, BookAuthorInsert, BookShelfInsert } from '@types/database';
import { artistSchema } from '@types/artist';

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 256 }).notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for user insertion with validation
export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

// Artists table to store unique artists and their images
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  imageUrl: text("image_url"),
  artistImageUrl: text("artist_image_url"),
  bio: text("bio"),
  listeners: integer("listeners"),
  playcount: integer("playcount"),
  lastUpdated: timestamp("last_updated"),
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

// Books table to store book data from Goodreads
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  goodreadsId: text("goodreads_id").unique(),
  title: text("title").notNull(),
  titleWithoutSeries: text("title_without_series"),
  description: text("description"),
  imageUrl: text("image_url"),
  link: text("link"),
  averageRating: text("average_rating"),
  pages: integer("pages"),
  publicationYear: integer("publication_year"),
  isbn: text("isbn"),
  isbn13: text("isbn13"),
  publisher: text("publisher"),
  language: text("language"),
  dateAdded: timestamp("date_added"),
  dateRead: timestamp("date_read"),
  userRating: text("user_rating"),
  dateCreated: timestamp("date_created").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Authors table to store book authors
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  goodreadsId: text("goodreads_id").unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  averageRating: text("average_rating"),
  ratingsCount: integer("ratings_count"),
  textReviewsCount: integer("text_reviews_count"),
  dateCreated: timestamp("date_created").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Shelves table to store book shelves/categories
export const shelves = pgTable("shelves", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  dateCreated: timestamp("date_created").defaultNow(),
});

// Many-to-many relationship between books and authors
export const bookAuthors = pgTable("book_authors", {
  bookId: integer("book_id").references(() => books.id).notNull(),
  authorId: integer("author_id").references(() => authors.id).notNull(),
  role: text("role"), // e.g. "Author", "Translator", etc.
}, (table) => ({
  pk: primaryKey(table.bookId, table.authorId),
}));

// Many-to-many relationship between books and shelves
export const bookShelves = pgTable("book_shelves", {
  bookId: integer("book_id").references(() => books.id).notNull(),
  shelfId: integer("shelf_id").references(() => shelves.id).notNull(),
  dateAdded: timestamp("date_added").defaultNow(),
}, (table) => ({
  pk: primaryKey(table.bookId, table.shelfId),
}));

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

// Book relationships
export const booksRelations = relations(books, ({ many }) => ({
  bookAuthors: many(bookAuthors),
  bookShelves: many(bookShelves),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  bookAuthors: many(bookAuthors),
}));

export const shelvesRelations = relations(shelves, ({ many }) => ({
  bookShelves: many(bookShelves),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, {
    fields: [bookAuthors.bookId],
    references: [books.id],
  }),
  author: one(authors, {
    fields: [bookAuthors.authorId],
    references: [authors.id],
  }),
}));

export const bookShelvesRelations = relations(bookShelves, ({ one }) => ({
  book: one(books, {
    fields: [bookShelves.bookId],
    references: [books.id],
  }),
  shelf: one(shelves, {
    fields: [bookShelves.shelfId],
    references: [shelves.id],
  }),
}));

// Export types from the shared types directory
export type {
  Artist,
  ArtistInsert,
  Song,
  SongInsert,
  Play,
  PlayInsert,
  Book,
  BookInsert,
  Author,
  AuthorInsert,
  Shelf,
  ShelfInsert,
  BookAuthorInsert,
  BookShelfInsert,
  InsertUser,
  SelectUser
};