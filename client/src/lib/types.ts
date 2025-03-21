export interface Author {
  id: number;
  name: string;
  goodreadsId?: string;
  imageUrl?: string;
}

export interface Shelf {
  id: number;
  name: string;
  goodreadsId?: string;
}

export interface Book {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  isbn?: string;
  isbn13?: string;
  numPages?: number;
  publicationYear?: number;
  userRating?: number;
  averageRating?: number;
  dateRead?: string;
  dateAdded?: string;
  link?: string;
  goodreadsId?: string;
}

export interface BookWithRelations extends Book {
  authors?: Author[];
  shelves?: Shelf[];
  bookAuthors?: any[];
  bookShelves?: any[];
}

export interface PaginatedResponse<T> {
  books: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}