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
  rating?: string;  // User's rating
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
    queryKey: ["/api/books"],
  });

  const reviews = data?.GoodreadsResponse?.reviews?.[0]?.review || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reviews.slice(0, 2).map((review, index) => {
        const title = review.book.title_without_series?.[0] ?? "Untitled";
        const description = review.book.description?.[0]?.replace(/<[^>]*>/g, "") ?? "";
        const imageUrl = review.book.image_url?.[0] ?? "/placeholder-book.png";
        const link = review.book.link?.[0] ?? "#";
        const author = review.book.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown";
        const rating = review.rating ? parseFloat(review.rating) : null;
        const averageRating = parseFloat(review.book.average_rating?.[0] ?? "0");

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
                  <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < averageRating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        ★
                      </span>
                    ))}
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