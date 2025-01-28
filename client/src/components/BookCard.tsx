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
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col">
            <div className="w-full h-48 bg-muted mb-4 flex items-center justify-center">
              No Image Available
            </div>
            <div>
              <h3 className="font-semibold text-lg">Loading...</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safely access properties with optional chaining and default values
  const title = review?.book?.title?.[0] ?? 'Untitled Book';
  const imageUrl = review?.book?.image_url?.[0] ?? 'https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png';
  const authorName = review?.book?.authors?.[0]?.author?.[0]?.name?.[0] ?? 'Unknown Author';
  const description = review?.book?.description?.[0]?.replace(/<[^>]*>/g, '') ?? 'No description available';
  const bookLink = review?.book?.link?.[0] ?? '#';

  return (
    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <img 
            src={imageUrl}
            alt={title}
            className="w-full h-48 object-cover mb-4"
          />
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              by {authorName}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
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