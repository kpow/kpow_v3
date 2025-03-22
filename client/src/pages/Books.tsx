import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { BookCard } from "@/components/BookCard";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { SEO } from "@/components/global/SEO";

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
  shelves?: {
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

const BOOKS_PER_PAGE = {
  mobile: 6,
  medium: 12,
  large: 18
};

function useResponsivePageSize() {
  const [pageSize, setPageSize] = useState(BOOKS_PER_PAGE.mobile);

  useEffect(() => {
    function updatePageSize() {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setPageSize(BOOKS_PER_PAGE.large);
      } else if (window.matchMedia('(min-width: 768px)').matches) {
        setPageSize(BOOKS_PER_PAGE.medium);
      } else {
        setPageSize(BOOKS_PER_PAGE.mobile);
      }
    }

    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  return pageSize;
}

export default function Books({ params }: { params?: { page?: string } }) {
  const currentPage = params?.page ? parseInt(params.page) : 1;
  const [, setLocation] = useLocation();

  // Handle invalid page numbers
  if (params?.page && (isNaN(currentPage) || currentPage < 1)) {
    setLocation("/books");
    return null;
  }

  const pageSize = useResponsivePageSize();
  const { data, isLoading, error } = useQuery<GoodreadsResponse>({
    queryKey: [`/api/db-books?page=${currentPage}&per_page=${pageSize}`],
    queryFn: async () => {
      console.log(`Fetching page ${currentPage} of books from database...`);
      const response = await fetch(
        `/api/db-books?page=${currentPage}&per_page=${BOOKS_PER_PAGE}`,
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

  const getPageTitle = () => {
    return `KPOW Book Collection ${currentPage > 1 ? `- Page ${currentPage}` : ""}`;
  };

  const getPageDescription = () => {
    if (data?.GoodreadsResponse?.reviews?.[0]?.review) {
      const recentBooks = data.GoodreadsResponse.reviews[0].review
        .slice(0, 3)
        .map((review) => review.book?.title?.[0])
        .join(", ");
      return `Currently reading and recently finished books including: ${recentBooks}. Page ${currentPage} of my book collection.`;
    }
    return "Explore my reading list and book recommendations. Updated regularly with new discoveries and favorite reads.";
  };

  const getPreviewImage = () => {
    const firstBook = data?.GoodreadsResponse?.reviews?.[0]?.review?.[0]?.book;
    return firstBook?.image_url?.[0] ?? "/book-placeholder.png";
  };

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
        <div className="flex justify-between items-center flex-col md:flex-row">
          <PageTitle size="lg" alignment="left">
            book feed
          </PageTitle>

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
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {[...Array(BOOKS_PER_PAGE)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
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

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
        image={getPreviewImage()}
        type="books.reads"
      />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center flex-col sm:flex-row">
          <PageTitle size="lg" alignment="left">
            book feed:
          </PageTitle>
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/books"
            onPageChange={() => {}}
            className="mb-3"
          />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {" "}
          {books.map((review: Book, index: number) => (
            <BookCard
              key={`${currentPage}-${index}`}
              review={review}
              allBooks={books}
              currentIndex={index}
            />
          ))}
        </div>

        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/books"
          onPageChange={() => {}}
        />
      </div>
    </>
  );
}
