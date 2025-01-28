import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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
      review: Book[];
    }>;
  };
}

const BOOKS_PER_PAGE = 8;

export default function Books() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
  });

  const books = data?.GoodreadsResponse?.reviews?.[0]?.review || [];
  const totalPages = Math.ceil(books.length / BOOKS_PER_PAGE);

  // Get current page's books
  const indexOfLastBook = currentPage * BOOKS_PER_PAGE;
  const indexOfFirstBook = indexOfLastBook - BOOKS_PER_PAGE;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        {[...Array(BOOKS_PER_PAGE)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Books</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {currentBooks.map((review, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <img 
                  src={review.book.image_url[0]} 
                  alt={review.book.title[0]}
                  className="w-full h-48 object-cover mb-4"
                />
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{review.book.title[0]}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {review.book.authors?.[0]?.author?.[0]?.name?.[0]}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {review.book.description[0]?.replace(/<[^>]*>/g, '')}
                  </p>
                  <a 
                    href={review.book.link[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View on Goodreads →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}