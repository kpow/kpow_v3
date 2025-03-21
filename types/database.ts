import { artists, songs, plays, books, authors, shelves, bookAuthors, bookShelves } from '../db/schema';

// Export database types from schema
export type Artist = typeof artists.$inferSelect;
export type ArtistInsert = typeof artists.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type SongInsert = typeof songs.$inferInsert;

export type Play = typeof plays.$inferSelect;
export type PlayInsert = typeof plays.$inferInsert;

// Book related types
export type Book = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;

export type Author = typeof authors.$inferSelect;
export type AuthorInsert = typeof authors.$inferInsert;

export type Shelf = typeof shelves.$inferSelect;
export type ShelfInsert = typeof shelves.$inferInsert;

export type BookAuthor = typeof bookAuthors.$inferSelect;
export type BookAuthorInsert = typeof bookAuthors.$inferInsert;

export type BookShelf = typeof bookShelves.$inferSelect;
export type BookShelfInsert = typeof bookShelves.$inferInsert;

// For API responses with extended relationship data
export interface BookWithRelations extends Book {
  authors?: Author[];
  shelves?: Shelf[];
}

export interface AuthorWithRelations extends Author {
  books?: Book[];
}

export interface ShelfWithRelations extends Shelf {
  books?: Book[];
}

// Common database response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Table specific types
export interface TableColumn {
  id: string;
  label: string;
  accessor: string;
  sortable?: boolean;
  className?: string;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TableQueryParams extends TableState {
  filters?: Record<string, string | number | boolean>;
}