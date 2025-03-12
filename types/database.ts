import { artists, songs, plays } from '../db/schema';

// Export database types from schema
export type Artist = typeof artists.$inferSelect;
export type ArtistInsert = typeof artists.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type SongInsert = typeof songs.$inferInsert;

export type Play = typeof plays.$inferSelect;
export type PlayInsert = typeof plays.$inferInsert;

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