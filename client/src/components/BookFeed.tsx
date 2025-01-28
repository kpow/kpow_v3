import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

  const readBooks = data?.GoodreadsResponse?.reviews?.[0]?.review
    .filter(book => book.shelves.shelf.some(s => s.$.name === "read"))
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {readBooks?.map((review, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img 
                src={review.book.image_url[0]} 
                alt={review.book.title[0]}
                className="w-24 h-36 object-cover"
              />
              <div>
                <h3 className="font-semibold text-lg">{review.book.title[0]}</h3>
                {review.book.authors?.[0]?.author?.[0]?.name?.[0] && (
                  <p className="text-sm text-muted-foreground mt-1">
                    by {review.book.authors[0].author[0].name[0]}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
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
      ))}
    </div>
  );
}