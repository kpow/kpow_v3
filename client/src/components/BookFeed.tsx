import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Book as BookIcon } from "lucide-react";

interface Book {
  id: Array<{
    _: string;
    $: { type: string; };
  }>;
  isbn: string[];
  isbn13: string[];
  title: string[];
  title_without_series: string[];
  image_url: string[];
  link: string[];
  average_rating: string[];
  description: string[];
  authors: Array<{
    author: Array<{
      id: string[];
      name: string[];
      role: string[];
      image_url: Array<{
        _: string;
        $: { nophoto: string; };
      }>;
    }>;
  }>;
}

interface Review {
  id: string[];
  book: Book;
  rating: string[];
  read_at: string[];
}

interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: Array<{
      $: { 
        start: string;
        end: string;
        total: string;
      };
      review: Review[];
    }>;
  };
}

export function BookFeed() {
  const { data, isLoading, error } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error("Error loading books:", error);
    return (
      <div className="text-sm text-red-500">
        Failed to load books. Please try again later.
      </div>
    );
  }

  // Safely access the reviews array with proper type checking
  const reviews = data?.GoodreadsResponse?.reviews?.[0]?.review;

  if (!reviews?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No books found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, 2).map((review) => {
        const { book } = review;

        if (!book?.title?.length) {
          return null;
        }

        return (
          <Card key={book.id[0]._} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {book.image_url?.[0] ? (
                  <img 
                    src={book.image_url[0]} 
                    alt={book.title[0]}
                    className="w-24 h-36 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-24 h-36 bg-muted flex items-center justify-center rounded-md">
                    <BookIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {book.title[0]}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {book.authors?.[0]?.author?.[0]?.name?.[0] || 'Unknown Author'}
                  </p>
                  <div className="text-yellow-500 text-sm mt-1">
                    {"★".repeat(Math.round(parseFloat(book.average_rating[0])))}
                    {"☆".repeat(5 - Math.round(parseFloat(book.average_rating[0])))}
                    <span className="text-muted-foreground ml-1">
                      ({book.average_rating[0]})
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                    {book.description?.[0]?.replace(/<[^>]*>/g, "") || 'No description available'}
                  </p>
                  <a 
                    href={book.link[0]}
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
        );
      })}
    </div>
  );
}