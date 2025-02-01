import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
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
  ratings: {
    user_rating: string;
    average_rating: string;
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

const BOOKS_PER_PAGE = 8;

export default function Books({ params }: { params?: { page?: string } }) {
  const currentPage = params?.page ? parseInt(params.page) : 1;
  const [, setLocation] = useLocation();

  // Handle invalid page numbers
  if (params?.page && (isNaN(currentPage) || currentPage < 1)) {
    setLocation("/books");
    return null;
  }

  const { data, isLoading, error } = useQuery<GoodreadsResponse>({
    queryKey: [`/api/books?page=${currentPage}&per_page=${BOOKS_PER_PAGE}`],
    queryFn: async () => {
      console.log(`Fetching page ${currentPage} of books...`);
      const response = await fetch(
        `/api/books?page=${currentPage}&per_page=${BOOKS_PER_PAGE}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      const data = await response.json();

      // Log ratings data for each book
      data.GoodreadsResponse.reviews[0].review.forEach((review: Book) => {
        console.log("Book ratings:", {
          title: review.book[0]?.title?.[0],
          user_rating: review.ratings.user_rating,
          average_rating: review.ratings.average_rating,
        });
      });

      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Error loading books
          </h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-6">My Books</h1>

          <div className="flex justify-center gap-2 items-center mb-3">
            <Button
              variant="outline"
              size="icon"
              disabled
              className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Loading</span>
            <Button
              variant="outline"
              size="icon"
              disabled
              className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {[...Array(BOOKS_PER_PAGE)].map((_, i) => (
            <Skeleton key={i} className="h-[240px] w-full" />
          ))}
        </div>
        <div className="flex justify-center gap-2 items-center mt-3">
          <Button
            variant="outline"
            size="icon"
            disabled
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Loading</span>
          <Button
            variant="outline"
            size="icon"
            disabled
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const books = data?.GoodreadsResponse?.reviews?.[0]?.review ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalBooks = pagination?.total ?? 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      console.log(`Changing to page ${newPage}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLocation(newPage === 1 ? "/books" : `/books/page/${newPage}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-3">My Books</h1>

        <div className="flex justify-center gap-2 items-center mb-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
        {books.map((review: Book, index: number) => (
          <BookCard key={`${currentPage}-${index}`} review={review} />
        ))}
      </div>

      <div className="flex justify-center gap-2 items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
