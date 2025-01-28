import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { BookCard } from "@/components/BookCard";

interface Book {
  book: {
    title: string[];
    description: string[];
    image_url: string[];
    link: string[];
    authors: Array<{
      author: Array<{
        name: string[];
      }>;
    }>;
  };
  shelves: {
    shelf: Array<{
      $: {
        name: string;
      };
    }>;
  };
}

interface GoodreadsResponse {
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
}

const BOOKS_PER_PAGE = 20; // Match with backend

export default function Books() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books", currentPage, BOOKS_PER_PAGE],
    queryFn: async () => {
      console.log(`Fetching page ${currentPage} of books...`);
      const response = await fetch(`/api/books?page=${currentPage}&per_page=${BOOKS_PER_PAGE}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      console.log(`Received data for page ${currentPage}:`, data);
      return data;
    },
    // Ensure query is refetched when page changes
    staleTime: 0,
    cacheTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading books</h1>
          <p className="text-gray-600">{error instanceof Error ? error.message : 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(BOOKS_PER_PAGE)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Safely access books array with optional chaining and default to empty array
  const books = data?.GoodreadsResponse?.reviews?.[0]?.review ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalBooks = pagination?.total ?? 0;

  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage}`);
    setCurrentPage(newPage);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Books</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {books.map((review, index) => (
          <BookCard key={`${currentPage}-${index}`} review={review} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages} ({totalBooks} books)
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}