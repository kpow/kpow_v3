import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { useQuery } from "@tanstack/react-query";

interface GoodreadsBook {
  book: {
    title_without_series: string[];
    image_url: string[];
    description: string[];
    average_rating: string[];
    authors: Array<{
      author: Array<{
        name: string[];
      }>;
    }>;
  };
}

interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: Array<{
      review: GoodreadsBook[];
    }>;
  };
}

export default function Home() {
  const { data: bookData } = useQuery<GoodreadsResponse>({
    queryKey: ["/api/books"],
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

  const bookFeed = bookData?.GoodreadsResponse?.reviews?.[1]?.review
    ?.slice(0, 2)
    .map(reviewData => ({
      title: reviewData?.book?.title_without_series?.[0] ?? "Untitled Book",
      subtitle: `by ${reviewData?.book?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown Author"}`,
      imageSrc: reviewData?.book?.image_url?.[0] ?? "/placeholder-book.png",
      type: 'book' as const,
      rating: parseFloat(reviewData?.book?.average_rating?.[0] ?? "0"),
      description: reviewData?.book?.description?.[0]?.replace(/<[^>]*>/g, '') ?? "No description available"
    })) || [];

  console.log('Book Data:', {
    rawResponse: bookData,
    reviews: bookData?.GoodreadsResponse?.reviews,
    bookFeed
  });

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
      {/* Main sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mainSections.map((section) => (
          <ContentSection
            key={section.title}
            {...section}
          />
        ))}
      </div>

      <div className="h-px bg-gray-200 my-8" />

      {/* Recently Played */}
      <RecentPlays />

      <div className="h-px bg-gray-200 my-8" />

      {/* Book Feed */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">book feed</h2>
          <button className="text-sm text-gray-500 hover:text-gray-700">SEE MORE</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bookFeed?.map((book, index) => (
            <ContentSection
              key={`${book.title}-${index}`}
              {...book}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-200 my-8" />

      {/* Star Feed */}
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