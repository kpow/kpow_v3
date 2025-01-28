import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";

interface Book {
  book: {
    id: string[];
    title: string[];
    image_url: string[];
    link: string[];
    description: string[];
    authors: Array<{
      author: Array<{
        name: string[];
      }>;
    }>;
  }[];
}

interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: [
      {
        review: Book[];
      }
    ];
  };
}

export default function Home() {
  const { data: booksData, isLoading: booksLoading } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
  });

  const books = booksData?.GoodreadsResponse?.reviews[0]?.review || [];

  return (
    <div className="container mx-auto p-4">
      <ContentSection title="Recent Plays">
        <RecentPlays />
      </ContentSection>

      <ContentSection title="Book Feed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {booksLoading ? (
            [...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-[250px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                  <Skeleton className="h-4 w-[200px] mt-4" />
                </CardContent>
              </Card>
            ))
          ) : (
            books.map((review) => (
              <Card key={review.book[0].id[0]} className="flex flex-col">
                <CardHeader>
                  <h2 className="text-2xl font-semibold">{review.book[0].title[0]}</h2>
                  <p className="text-gray-600">
                    by {review.book[0].authors[0].author[0].name[0]}
                  </p>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <div className="aspect-[2/3] relative mb-4">
                    <img
                      src={review.book[0].image_url[0]}
                      alt={review.book[0].title[0]}
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {review.book[0].description ? review.book[0].description[0].replace(/<[^>]+>/g, '') : 'No description available'}
                  </p>
                  <a
                    href={review.book[0].link[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 mt-auto"
                  >
                    View on Goodreads
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ContentSection>
    </div>
  );
}