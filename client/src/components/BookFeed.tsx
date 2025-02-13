
import { useQuery } from "@tanstack/react-query";
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const reviews = data?.GoodreadsResponse?.reviews?.[0]?.review || [];
  const displayReviews = reviews.length > 2 
    ? reviews.sort(() => Math.random() - 0.5).slice(0, 2) 
    : reviews;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {displayReviews.map((review, index) => {
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
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-[150px] h-[200px] object-cover rounded-lg"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {author}</p>
                  <p className="text-sm line-clamp-3">{description}</p>
                  <div className="mt-2">
                    <span className="text-sm">
                      Rating: {userRating} / {averageRating}
                    </span>
                  </div>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 block"
                  >
                    View on Goodreads
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
