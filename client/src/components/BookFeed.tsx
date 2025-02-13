import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Book {
  book: {
    title_without_series: string[];
    description: string[];
    image_url: string[];
    link: string[];
    authors: Array<{
      author: Array<{
        name: string[];
      }>;
    }>;
    average_rating: string[];
  };
  ratings: {
    user_rating: string;
    average_rating: string;
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
  const { data, isLoading } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books?per_page=50"],
  });

  const reviews = data?.GoodreadsResponse?.reviews?.[0]?.review || [];
  const randomReviews = reviews.length > 2 
    ? reviews.sort(() => Math.random() - 0.5).slice(0, 2) 
    : reviews;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(isMobile ? randomReviews.slice(0, 1) : randomReviews).map((review, index) => {
        const title = review.book[0].title_without_series?.[0] ?? "Untitled";
        const description =
          review.book[0].description[0]?.replace(/<[^>]*>/g, "") ?? "";
        const imageUrl =
          review.book[0].image_url?.[0] ?? "/placeholder-book.png";
        const link = review.book[0].link?.[0] ?? "#";
        const author =
          review.book[0].authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown";
        const userRating = parseFloat(review.ratings?.user_rating ?? "0");
        const averageRating = parseFloat(review.ratings?.average_rating ?? "0");

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full md:w-40 h-54 object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {author}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Your Rating</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={`user-${i}`}
                            className={`text-sm ${i < userRating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Average</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={`avg-${i}`}
                            className={`text-sm ${i < averageRating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-6 mt-2">
                    {description}
                  </p>
                  <a
                    href={link}
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