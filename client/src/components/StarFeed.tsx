import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContentSection } from "@/components/home/ContentSection";
import { StarredArticle } from "@/lib/hooks/use-starred-articles";
import { Skeleton } from "@/components/ui/skeleton";

interface StarFeedResponse {
  articles: StarredArticle[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export function StarFeed() {
  const isMobile = useIsMobile();
  const { data: starredData, isLoading } = useQuery<StarFeedResponse>({
    queryKey: ["/api/starred-articles?page=1&per_page=3"],
    queryFn: async () => {
      const response = await fetch("/api/starred-articles?page=1&per_page=3");
      if (!response.ok) {
        throw new Error("Failed to fetch starred articles");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: isMobile ? 1 : 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const starFeed = starredData?.articles.map((article) => ({
    title: article.title ?? "Untitled Article",
    subtitle: `by ${article.author ?? "Unknown Author"}`,
    author: article.author ?? "Unknown Author",
    date: new Date(article.published).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    imageSrc: article.lead_image_url ?? "/placeholder-star.png",
    type: "star" as const,
    url: article.url ?? "#",
    excerpt: article.summary ?? "No excerpt available",
  })) ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {(isMobile ? starFeed.slice(0, 1) : starFeed).map((star) => (
        <ContentSection
          key={star.url}
          {...star}
          excerpt={star.excerpt}
        />
      ))}
    </div>
  );
}
