import { Card, CardContent } from "@/components/ui/card";

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
  shelves: {
    shelf: Array<{
      $: {
        name: string;
      };
    }>;
  };
}

interface BookCardProps {
  review: Book;
}

export function BookCard({ review }: BookCardProps) {
  if (!review || !review.book) {
    return (
      <Card className="overflow-hidden h-full">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-36 h-48 bg-muted flex items-center justify-center">
              No Image
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Loading...</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = review?.book[0]?.title?.[0] ?? "Untitled Book";
  const imageUrl = review?.book[0]?.image_url?.[0] ?? "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";
  const authorName = review?.book[0]?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown Author";
  const description = review?.book[0]?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "No description available";
  const bookLink = review?.book[0]?.link?.[0] ?? "#";
  const userRating = parseFloat(review.ratings?.user_rating ?? "0");
  const averageRating = parseFloat(review.ratings?.average_rating ?? "0");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48 relative bg-black">
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              by {authorName}
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
              href={bookLink}
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
}