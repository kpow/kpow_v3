// Central definition of Book interfaces for the application

/**
 * Represents a book from the Goodreads API or our database
 */
export interface Book {
  book: [{
    title: string[];
    title_without_series?: string[];
    description: string[];
    image_url: string[];
    link: string[];
    id?: string[];
    average_rating?: string[];
    authors: Array<{
      author: Array<{
        id?: string[];
        name: string[];
      }>;
    }>;
  }];
  ratings: {
    user_rating: string;
    average_rating: string;
  };
  shelves: {
    shelf: Array<{
      $: {
        name: string;
      };
    }>;
  };
}

/**
 * Response from the Goodreads API or our enhanced book search endpoint
 */
export interface BookResponse {
  GoodreadsResponse: {
    reviews: Array<{
      $: { start: string; end: string; total: string };
      review: Book[];
    }>;
  };
  pagination: {
    total: number;
    start: number;
    end: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters?: {
    search: string;
    searchInDescription: boolean;
    shelf: string;
  };
  sorting?: {
    sortBy: string;
    sortOrder: string;
  };
}

/**
 * Represents a shelf (genre/category) for books
 */
export interface Shelf {
  id: number;
  name: string;
}

/**
 * Response from the shelves API endpoint
 */
export interface ShelvesResponse {
  shelves: Shelf[];
}