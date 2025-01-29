import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ContentSection } from "@/components/ContentSection";
import { StarredArticle } from "@/lib/hooks/use-starred-articles";

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface StarredResponse {
  articles: StarredArticle[];
  pagination: PaginationData;
}

const ARTICLES_PER_PAGE = 9;

export default function StarredArticles() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery<StarredResponse>({
    queryKey: [`/api/starred-articles?page=${currentPage}&per_page=${ARTICLES_PER_PAGE}`],
    onSuccess: (data) => {
      // Log the articles' dates to verify ordering
      console.log('Received articles with dates:', 
        data.articles.map(article => ({
          title: article.title,
          published: new Date(article.published).toLocaleString()
        }))
      );
    }
  });

  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalArticles = data?.pagination?.total ?? 0;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-3">Starred Articles</h1>
        <div className="flex justify-center gap-2 items-center mb-6">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Loading...</span>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: ARTICLES_PER_PAGE }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const articles = data?.articles.map(article => ({
    title: article.title ?? 'Untitled Article',
    subtitle: `by ${article.author ?? 'Unknown Author'}`,
    author: article.author ?? 'Unknown Author',
    date: new Date(article.published).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    imageSrc: article.lead_image_url ?? "/placeholder-star.png",
    type: "star" as const,
    url: article.url ?? '#',
    excerpt: article.summary ?? 'No excerpt available'
  })) ?? [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-3">Starred Articles</h1>

      <div className="flex justify-center gap-2 items-center mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {currentPage} of {totalPages} ({totalArticles} articles)
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article, index) => (
          <ContentSection
            key={`${currentPage}-${index}`}
            {...article}
            excerpt={article.excerpt}
          />
        ))}
      </div>


    </div>
  );
}