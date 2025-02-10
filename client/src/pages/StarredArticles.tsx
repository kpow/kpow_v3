import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { ContentSection } from "@/components/ContentSection";
import { StarredArticle } from "@/lib/hooks/use-starred-articles";
import { useToast } from "@/hooks/use-toast";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";

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

export default function StarredArticles({
  params,
}: {
  params?: { page?: string };
}) {
  const currentPage = params?.page ? parseInt(params.page) : 1;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle invalid page numbers
  if (params?.page && (isNaN(currentPage) || currentPage < 1)) {
    setLocation("/starred-articles");
    return null;
  }

  const { data, isLoading, error } = useQuery<StarredResponse>({
    queryKey: [
      `/api/starred-articles?page=${currentPage}&per_page=${ARTICLES_PER_PAGE}`,
    ],
  });

  if (error) {
    toast({
      title: "Error loading articles",
      description:
        error instanceof Error ? error.message : "Please try again later",
      variant: "destructive",
    });
  }

  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalArticles = data?.pagination?.total ?? 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLocation(
        newPage === 1
          ? "/starred-articles"
          : `/starred-articles/page/${newPage}`,
      );
    }
  };

  const articles =
    data?.articles.map((article: StarredArticle) => ({
      title: article.title ?? "Untitled Article",
      subtitle: `by ${article.author ?? "Unknown Author"}`,
      author: article.author ?? "Unknown Author",
      date: new Date(article.published).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      imageSrc: article.lead_image_url ?? "/placeholder-star.png",
      type: "star" as const,
      url: article.url ?? "#",
      excerpt: article.summary ?? "No excerpt available",
    })) ?? [];

  function PaginationLoader() {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          disabled
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">Loading</span>
        <Button
          variant="outline"
          size="icon"
          disabled
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-3">star feed</h1>
          <div className="flex justify-center gap-2 items-center mb-6">
            <PaginationLoader />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: ARTICLES_PER_PAGE }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-80 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 items-center mt-6">
          <PaginationLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center flex-col sm:flex-row">
        <PageTitle size="lg" alignment="left">
          star feed
        </PageTitle>
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/starred-articles"
          onPageChange={handlePageChange}
          className="mb-6"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <ContentSection
            key={article.url}
            {...article}
            excerpt={article.excerpt}
          />
        ))}
      </div>

      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/starred-articles"
        onPageChange={handlePageChange}
        className="mt-6"
      />
    </div>
  );
}
