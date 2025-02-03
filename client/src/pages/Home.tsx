import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { BookFeed } from "@/components/BookFeed";
import { GitHubSection } from "@/components/GitHubSection";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useStarredArticles } from "@/lib/hooks/use-starred-articles";

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
  const { data: bookData, isLoading: isLoadingBooks } =
    useQuery<GoodreadsResponse>({
      queryKey: ["/api/books"],
    });

  const { data: starredData, isLoading: isLoadingStarred } = useStarredArticles(
    1,
    3,
  );

  const reviews = bookData?.GoodreadsResponse?.reviews?.[0]?.review || [];
  const firstBook = reviews[0]?.book;

  const firstBookTitle = firstBook?.title_without_series?.[0];
  const firstBookAuthor = firstBook?.authors?.[0]?.author?.[0]?.name?.[0];
  const firstBookRating = firstBook?.average_rating?.[0];

  const mainSections = [
    {
      title: "battle",
      subtitle: "PLAY",
      imageSrc: "/battle.jpg",
      type: "main" as const,
      link: "/battle",
    },
    {
      title: "tunes",
      subtitle: "LISTEN",
      imageSrc: "/tunes.jpg",
      type: "main" as const,
      link: "/videos",
    },
    {
      title: "pmonk",
      subtitle: "CHECKIT",
      imageSrc: "/pmonk.jpg",
      type: "main" as const,
      link: "/pmonk",
    },
  ];

  const bookFeed = [
    {
      title: firstBook?.title_without_series?.[0] ?? "Untitled",
      subtitle: `by ${firstBook?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown"}`,
      imageSrc: firstBook?.image_url?.[0] ?? "/placeholder-book.png",
      type: "book" as const,
      rating: parseFloat(firstBook?.average_rating?.[0] ?? "0"),
      description: firstBook?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "",
    },
    {
      title: reviews[1]?.book?.title_without_series?.[0] ?? "Untitled",
      subtitle: `by ${reviews[1]?.book?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown"}`,
      imageSrc: reviews[1]?.book?.image_url?.[0] ?? "/placeholder-book.png",
      type: "book" as const,
      rating: parseFloat(reviews[1]?.book?.average_rating?.[0] ?? "0"),
      description:
        reviews[1]?.book?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "",
    },
  ];

  const starFeed = starredData?.articles ?? [
    {
      title: "Loading...",
      subtitle: "Please wait",
      author: "Loading",
      date: "Loading",
      imageSrc: "/placeholder-star.png",
      type: "star" as const,
      excerpt: "Loading content...",
    },
  ];

  if (isLoadingBooks || isLoadingStarred) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mainSections.map((section) => (
          <ContentSection key={section.title} {...section} />
        ))}
      </div>

      <div className="h-px bg-gray-200 my-4" />

      <RecentPlays />

      <div className="h-px bg-gray-200 my-4" />

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">book feed</h2>
          <Link key="BookFeed" href="books">
            <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
              more books
            </button>
          </Link>
        </div>
        <BookFeed />
      </div>

      <div className="h-px bg-gray-200 my-4" />

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">star feed</h2>
          <Link key="StarFeed" href="starred-articles">
            <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
              more articles
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoadingStarred
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            : starFeed.map((star) => (
                <ContentSection
                  key={star.title}
                  {...star}
                  excerpt={star.excerpt}
                />
              ))}
        </div>
      </div>

      <div className="h-px bg-gray-200 my-4" />

      <GitHubSection />

      <div className="h-px bg-gray-200 my-4" />
    </div>
  );
}
