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
    average_rating: string[];
    ratings_count: string[];
  };
  rating?: string;  // User's rating
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

  const title = review?.book.title?.[0] ?? "Untitled Book";
  const imageUrl = review?.book.image_url?.[0] ?? "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";
  const authorName = review?.book.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown Author";
  const description = review?.book.description?.[0]?.replace(/<[^>]*>/g, "") ?? "No description available";
  const bookLink = review?.book.link?.[0] ?? "#";
  const averageRating = parseFloat(review?.book.average_rating?.[0] ?? "0");
  const ratingsCount = parseInt(review?.book.ratings_count?.[0] ?? "0");
  const userRating = review?.rating ? parseFloat(review.rating) : null;

  const renderStars = (rating: number | null) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${i < (rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <img
            src={imageUrl}
            alt={title}
            className="w-full md:w-36 h-48 object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              by {authorName}
            </p>

            {userRating && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Your rating:</span>
                  {renderStars(userRating)}
                </div>
              </div>
            )}

            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Average rating:</span>
                {renderStars(averageRating)}
                <span className="text-sm text-muted-foreground">({ratingsCount})</span>
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