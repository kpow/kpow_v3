import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { ContentSection } from "@/components/home/ContentSection";
import { StarredArticle } from "@/lib/hooks/use-starred-articles";
import { useToast } from "@/hooks/use-toast";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { SEO } from "@/components/global/SEO";
import { getRandomDefaultImage } from "@/lib/utils";
import { MonthSelector } from "@/components/ui/month-selector";

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface MonthIndexData {
  availableMonths: {
    month: number;
    year: number;
    name: string;
  }[];
}

interface StarredResponse {
  articles: StarredArticle[];
  pagination: PaginationData;
  monthIndex?: MonthIndexData;
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
  
  // State for selected month/year
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Create an effect to initialize the month index
  useEffect(() => {
    // We'll call our build-index endpoint only once to initialize the data
    const initializeMonthIndex = async () => {
      try {
        const existingMonths = await fetch('/api/starred-articles/months');
        const monthsData = await existingMonths.json();
        
        // Only build the index if we don't have any months available
        if (!monthsData.availableMonths || monthsData.availableMonths.length === 0) {
          await fetch('/api/starred-articles/build-index', { method: 'POST' });
          toast({
            title: "Month index initialized",
            description: "You can now browse articles by month",
          });
        }
      } catch (error) {
        console.error("Error initializing month index:", error);
      }
    };
    
    initializeMonthIndex();
  }, [toast]);

  // Handle invalid page numbers
  if (params?.page && (isNaN(currentPage) || currentPage < 1)) {
    setLocation("/starred-articles");
    return null;
  }

  // Helper function to get month name
  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };
  
  // Handle month selection
  const handleMonthSelect = (month: number, year: number) => {
    // If month and year are both 0, it means "clear selection"
    if (month === 0 && year === 0) {
      setSelectedMonth(null);
      setSelectedYear(null);
      // Reset to first page
      if (currentPage !== 1) {
        setLocation("/starred-articles");
      }
      return;
    }
    
    setSelectedMonth(month);
    setSelectedYear(year);
    // When selecting a month, always start at page 1
    setLocation("/starred-articles");
  };
  
  // Build the API query including month/year if selected
  let apiQuery = `/api/starred-articles?page=${currentPage}&per_page=${ARTICLES_PER_PAGE}`;
  if (selectedMonth && selectedYear) {
    apiQuery += `&month=${selectedMonth}&year=${selectedYear}`;
  }

  const { data, isLoading, error } = useQuery<StarredResponse>({
    queryKey: [apiQuery],
    queryFn: async () => {
      const response = await fetch(apiQuery);
      if (!response.ok) {
        throw new Error("Failed to fetch starred articles");
      }
      return response.json();
    }
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
        year: "numeric",
      }),
      imageSrc: article.lead_image_url ?? getRandomDefaultImage(),
      type: "star" as const,
      url: article.url ?? "#",
      excerpt: article.summary ?? "No excerpt available",
    })) ?? [];

  // Get the first article's image for the SEO preview, if available
  const previewImage = articles[0]?.imageSrc ?? getRandomDefaultImage();
  const pageTitle = `Star Feed ${currentPage > 1 ? `- Page ${currentPage}` : ""}`;
  const pageDescription = `Curated collection of starred articles. ${articles
    .slice(0, 3)
    .map((a) => a.title)
    .join(", ")}`;

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
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        image={previewImage}
        type="article"
      />
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
        
        {/* Month Selector */}
        <div className="mb-8">
          <MonthSelector 
            onSelectMonth={handleMonthSelect}
            selectedMonth={selectedMonth || undefined}
            selectedYear={selectedYear || undefined}
          />
          
          {selectedMonth && selectedYear && (
            <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              <p className="text-sm font-medium">
                Viewing articles from {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>
          )}
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ContentSection
                key={article.url}
                {...article}
                excerpt={article.excerpt}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl font-semibold mb-2">No articles found</p>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedMonth && selectedYear 
                ? `No articles found for ${getMonthName(selectedMonth)} ${selectedYear}`
                : "No articles available"}
            </p>
            {selectedMonth && selectedYear && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => handleMonthSelect(0, 0)}
              >
                Clear Filter
              </Button>
            )}
          </div>
        )}

        {articles.length > 0 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/starred-articles"
            onPageChange={handlePageChange}
            className="mt-6"
          />
        )}
      </div>
    </>
  );
}
