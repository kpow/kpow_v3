import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Book {
  book: {
    title?: string[];
    description?: string[];
    image_url?: string[];
    link?: string[];
    authors?: Array<{
      author?: Array<{
        name?: string[];
      }>;
    }>;
  };
}

interface GoodreadsResponse {
  GoodreadsResponse?: {
    reviews?: Array<{
      review?: Book[];
    }>;
  };
}

export function BookFeed() {
  const { data, isLoading, error } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
  });

  const books = data?.GoodreadsResponse?.reviews?.[0]?.review?.slice(0, 2) || [];

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

  if (!books?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No books found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {books.map((review, index) => {
        const title = review?.book?.title?.[0] || 'Untitled';
        const imageUrl = review?.book?.image_url?.[0] || '';
        const authorName = review?.book?.authors?.[0]?.author?.[0]?.name?.[0];
        const description = review?.book?.description?.[0]?.replace(/<[^>]*>/g, '') || '';
        const link = review?.book?.link?.[0] || '#';

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {imageUrl && (
                  <img 
                    src={imageUrl}
                    alt={title}
                    className="w-24 h-36 object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  {authorName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      by {authorName}
                    </p>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                      {description}
                    </p>
                  )}
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