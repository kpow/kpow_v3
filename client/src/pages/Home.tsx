import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { BookFeed } from "@/components/BookFeed";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Author {
  name: string[];
}

interface Book {
  book: {
    title_without_series: string[];
    description: string[];
    image_url: string[];
    link: string[];
    authors: Array<{
      author: Array<Author>;
    }>;
    average_rating: string[];
  };
}

interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: Array<{
      $: { start: string; end: string; total: string };
      review: Book[];
    }>;
  };
}

export default function Home() {
  const { data: bookData, isLoading } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
  });

  // Debug logs to trace data flow
  const reviews = bookData?.GoodreadsResponse?.reviews?.[0]?.review || [];
  const firstBook = reviews[0]?.book;
  console.log('First Book:', firstBook);

  // Extract values from arrays
  const firstBookTitle = firstBook?.title_without_series?.[0];
  const firstBookAuthor = firstBook?.authors?.[0]?.author?.[0]?.name?.[0];
  const firstBookRating = firstBook?.average_rating?.[0];

  console.log('Extracted Values:', {
    title: firstBookTitle,
    author: firstBookAuthor,
    rating: firstBookRating
  });

  const mainSections = [
    {
      title: "battle",
      subtitle: "PLAY",
      imageSrc: "/battle.jpg",
      type: 'main' as const
    },
    {
      title: "tunes",
      subtitle: "LISTEN",
      imageSrc: "/tunes.jpg",
      type: 'main' as const
    },
    {
      title: "pmonk",
      subtitle: "CREDIT",
      imageSrc: "/pmonk.jpg",
      type: 'main' as const
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  const bookFeed = [
    {
      title: firstBook?.title_without_series?.[0] ?? "Untitled",
      subtitle: `by ${firstBook?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown"}`,
      imageSrc: firstBook?.image_url?.[0] ?? "/placeholder-book.png",
      type: 'book' as const,
      rating: parseFloat(firstBook?.average_rating?.[0] ?? "0"),
      description: firstBook?.description?.[0]?.replace(/<[^>]*>/g, '') ?? ""
    },
    {
      title: reviews[1]?.book?.title_without_series?.[0] ?? "Untitled",
      subtitle: `by ${reviews[1]?.book?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown"}`,
      imageSrc: reviews[1]?.book?.image_url?.[0] ?? "/placeholder-book.png",
      type: 'book' as const,
      rating: parseFloat(reviews[1]?.book?.average_rating?.[0] ?? "0"),
      description: reviews[1]?.book?.description?.[0]?.replace(/<[^>]*>/g, '') ?? ""
    }
  ];

  const starFeed = [
    {
      title: "AI-Generated Disinformation",
      subtitle: "Understanding its Impact and Implications",
      author: "Tech Research",
      date: "Jan 24",
      imageSrc: "/placeholder-star.png",
      type: 'star' as const
    },
    {
      title: "The Future of Lead Generation",
      subtitle: "Why First Party Data Will Define 2025",
      author: "Marketing Insights",
      date: "Jan 23",
      imageSrc: "/placeholder-star.png",
      type: 'star' as const
    },
    {
      title: "Understanding API WebSockets",
      subtitle: "How They Work, Benefits, and Best Practices",
      author: "Dev Community",
      date: "Jan 22",
      imageSrc: "/placeholder-star.png",
      type: 'star' as const
    }
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mainSections.map((section) => (
          <ContentSection
            key={section.title}
            {...section}
          />
        ))}
      </div>

      <div className="h-px bg-gray-200 my-8" />

      <RecentPlays />

      <div className="h-px bg-gray-200 my-8" />

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">book feed</h2>
          <button className="text-sm text-gray-500 hover:text-gray-700">SEE MORE</button>
        </div>
        <BookFeed />
      </div>

      <div className="h-px bg-gray-200 my-8" />

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">star feed</h2>
          <button className="text-sm text-gray-500 hover:text-gray-700">SEE MORE</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {starFeed.map((star) => (
            <ContentSection
              key={star.title}
              {...star}
            />
          ))}
        </div>
      </div>
    </div>
  );
}