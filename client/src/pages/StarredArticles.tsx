import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { ContentSection } from "@/components/home/ContentSection";
import { StarredArticle, useStarredArticles } from "@/lib/hooks/use-starred-articles";
import { useToast } from "@/hooks/use-toast";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { SEO } from "@/components/global/SEO";
import { getRandomDefaultImage } from "@/lib/utils";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface DateFilter {
  since: string | null;
  until: string | null;
  month: number | null;
  year: number | null;
}

interface StarredResponse {
  articles: StarredArticle[];
  pagination: PaginationData;
  dateFilter: DateFilter;
}

const ARTICLES_PER_PAGE = 9;

// Helper function to format month name
function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
}

export default function StarredArticles({
  params,
}: {
  params?: { page?: string; month?: string; year?: string };
}) {
  const currentPage = params?.page ? parseInt(params.page) : 1;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Date filter state
  const [month, setMonth] = useState<number | null>(
    params?.month ? parseInt(params.month) : null
  );
  const [year, setYear] = useState<number | null>(
    params?.year ? parseInt(params.year) : null
  );

  // Handle invalid page numbers
  if (params?.page && (isNaN(currentPage) || currentPage < 1)) {
    setLocation("/starred-articles");
    return null;
  }

  // Use our custom hook instead of direct useQuery
  const { data, isLoading, error } = useStarredArticles(
    currentPage,
    ARTICLES_PER_PAGE,
    month,
    year
  );

  // Handle errors
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
  const dateFilter = data?.dateFilter;

  // Handle date range selection
  const handleDateChange = (newMonth: number | null, newYear: number | null) => {
    // Reset to page 1 when date filter changes
    setMonth(newMonth);
    setYear(newYear);
    
    // Update the URL to reflect the new filters
    let newPath = "/starred-articles";
    const queryParams = [];
    
    if (newMonth !== null) {
      queryParams.push(`month=${newMonth}`);
    }
    
    if (newYear !== null) {
      queryParams.push(`year=${newYear}`);
    }
    
    if (queryParams.length > 0) {
      newPath += `?${queryParams.join("&")}`;
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLocation(newPath);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Build the URL with all current filters
      let newPath = "/starred-articles";
      if (newPage > 1) {
        newPath += `/page/${newPage}`;
      }
      
      const queryParams = [];
      if (month !== null) {
        queryParams.push(`month=${month}`);
      }
      if (year !== null) {
        queryParams.push(`year=${year}`);
      }
      
      if (queryParams.length > 0) {
        newPath += `?${queryParams.join("&")}`;
      }
      
      setLocation(newPath);
    }
  };

  // Articles array converted from data
  const articles = data?.articles ?? [];

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
        <div className="flex justify-between items-center flex-col sm:flex-row mb-4">
          <PageTitle size="lg" alignment="left">
            star feed
          </PageTitle>
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/starred-articles"
            onPageChange={handlePageChange}
            className="mb-2 sm:mb-0"
          />
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-md font-medium mb-1">Filter by date</h3>
                <div className="text-sm text-muted-foreground">
                  Browse articles from a specific month
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                <MonthYearPicker
                  month={month}
                  year={year}
                  onChange={handleDateChange}
                  minYear={2016}
                  maxYear={new Date().getFullYear()}
                  onReset={() => handleDateChange(null, null)}
                />
                
                {(month !== null || year !== null) && (
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    {month !== null && (
                      <Badge variant="secondary" className="text-xs py-1">
                        {getMonthName(month)}
                      </Badge>
                    )}
                    {year !== null && (
                      <Badge variant="secondary" className="text-xs py-1">
                        {year}
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDateChange(null, null)}
                      className="h-7 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {totalArticles > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {totalArticles} article{totalArticles !== 1 ? 's' : ''}
                {month !== null && ` from ${getMonthName(month)}`}
                {year !== null && ` ${month !== null ? '' : 'from '}${year}`}
              </p>
            )}
          </CardContent>
        </Card>

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
          <div className="py-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground">
              Try selecting a different month or year.
            </p>
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
