import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  return (
    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <img 
            src={review.book.image_url[0]} 
            alt={review.book.title[0]}
            className="w-full h-48 object-cover mb-4"
          />
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{review.book.title[0]}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              by {review.book.authors?.[0]?.author?.[0]?.name?.[0]}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {review.book.description[0]?.replace(/<[^>]*>/g, '')}
            </p>
            <a 
              href={review.book.link[0]} 
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