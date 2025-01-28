import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Book {
  title_without_series: string[];
  image_url: string[];
  average_rating: string[];
  description: string[];
  authors: Array<{
    author: Array<{
      name: string[];
    }>;
  }>;
}

interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: Array<{
      review: Array<{
        book: Book;
      }>;
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
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to load books. Please try again later.
      </div>
    );
  }

  const reviews = data?.GoodreadsResponse?.reviews[1]?.review || [];

  if (!reviews.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No books found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, 2).map((review, index) => {
        const { book } = review;

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <img 
                  src={book.image_url[0]} 
                  alt={book.title_without_series[0]}
                  className="w-24 h-36 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {book.title_without_series[0]}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {book.authors[0].author[0].name[0]}
                  </p>
                  <div className="text-yellow-500 text-sm mt-1">
                    {"★".repeat(Math.round(parseFloat(book.average_rating[0])))}
                    {"☆".repeat(5 - Math.round(parseFloat(book.average_rating[0])))}
                    ({book.average_rating[0]})
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                    {book.description[0]?.replace(/<[^>]*>/g, "")}
                  </p>
                  <a 
                    href="#"
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