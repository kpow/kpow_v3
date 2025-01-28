import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Book {
  book: {
    title_without_series: string[];
    image_url: string[];
    average_rating: string[];
    description: string[];
    authors: Array<{
      author: Array<{
        name: string[];
      }>;
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

export function BookFeed() {
  const { data, isLoading, error } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
  });

  console.log("Raw Books data:", data?.GoodreadsResponse?.reviews[0]?.review); // Debug log

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

  const reviews = data?.GoodreadsResponse?.reviews[0]?.review || [];

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
        const book = review.book;
        console.log("Processing book:", book); // Debug log for each book

        // Safely access nested properties with optional chaining
        const title = book?.book?.title_without_series?.[0] || "Untitled";
        const imageUrl = book?.book?.image_url?.[0];
        const authorName = book?.book?.authors?.[0]?.author?.[0]?.name?.[0];
        const rating = book?.book?.average_rating?.[0] || "0";
        const description = book?.book?.description?.[0]?.replace(/<[^>]*>/g, "") || "";

        const stars = "★".repeat(Math.round(parseFloat(rating)));
        const emptyStars = "☆".repeat(5 - Math.round(parseFloat(rating)));

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {imageUrl && (
                  <img 
                    src={imageUrl}
                    alt={title}
                    className="w-24 h-36 object-cover rounded-md"
                    onError={(e) => {
                      console.log("Image failed to load:", imageUrl);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{title}</h3>
                  {authorName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      by {authorName}
                    </p>
                  )}
                  <div className="text-yellow-500 text-sm mt-1">
                    {stars}{emptyStars} ({rating})
                  </div>
                  {description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                      {description}
                    </p>
                  )}
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