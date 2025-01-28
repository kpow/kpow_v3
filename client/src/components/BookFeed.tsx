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
  const firstBook = reviews[0]?.book;
  console.log("inside comp first Book:", firstBook);

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
        console.log("inside comp review:", review);
        console.log("inside comp review,book:", review.book);
        console.log(
          "inside comp review,book.description[0]:",
          review.book[0].description[0],
        );
        // Get values from the nested array structure
        const title = review.book[0].title_without_series?.[0] ?? "Untitled";
        const description =
          review.book[0].description[0]?.replace(/<[^>]*>/g, "") ?? "";
        const imageUrl =
          review.book[0].image_url?.[0] ?? "/placeholder-book.png";
        const link = review.book[0].link?.[0] ?? "#";
        const author =
          review.book[0].authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown";
        const rating = parseFloat(review.book[0].average_rating?.[0] ?? "0");

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-24 h-36 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {author}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
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
