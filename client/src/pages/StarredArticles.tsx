import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon, Search } from "lucide-react";
import { useLocation } from "wouter";
import { ContentSection } from "@/components/home/ContentSection";
import { StarredArticle } from "@/lib/hooks/use-starred-articles";
import { useToast } from "@/hooks/use-toast";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { SEO } from "@/components/global/SEO";
import { getRandomDefaultImage } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import yearMonthIndex from "../data/year-month-starred-article-index.json";

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

// Component for month and year selection
function MonthYearSelector({
  onNavigate,
  totalArticles,
}: {
  onNavigate: (page: number) => void;
  totalArticles: number;
}) {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Get unique years from the index, sorted in descending order
  const years = Array.from(
    new Set(yearMonthIndex.entries.map((entry) => entry.year.toString())),
  ).sort((a, b) => parseInt(b) - parseInt(a));

  // Get months that have entries for the selected year
  const availableMonths = selectedYear
    ? yearMonthIndex.entries
        .filter((entry) => entry.year.toString() === selectedYear)
        .map((entry) => entry.month)
        .sort((a, b) => b - a) // Sort in descending order
    : [];

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth(""); // Reset month when year changes
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  const handleNavigate = () => {
    if (selectedYear && selectedMonth) {
      const yearNum = parseInt(selectedYear);
      const monthNum = parseInt(selectedMonth);

      // Find the corresponding page in the index
      const entry = yearMonthIndex.entries.find(
        (e) => e.year === yearNum && e.month === monthNum,
      );

      if (entry) {
        // Calculate page adjustment based on new articles added since index was created
        // The index was created when there were 6131 total articles
        // For every 9 new articles, we need to add 1 to the page number
        const indexTotalArticles = yearMonthIndex.totalArticles; // 6131

        let adjustedPage = entry.startPage;

        // If we have more articles now than when the index was created
        if (totalArticles > indexTotalArticles) {
          const newArticles = totalArticles - indexTotalArticles;
          const pageAdjustment = Math.floor(newArticles / ARTICLES_PER_PAGE);
          adjustedPage += pageAdjustment;
        }

        onNavigate(adjustedPage);
      }
    }
  };

  // Get month name from number
  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString("default", { month: "long" });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedMonth}
          onValueChange={handleMonthChange}
          disabled={!selectedYear}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {getMonthName(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleNavigate}
          disabled={!selectedYear || !selectedMonth}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
        >
          <Search className="h-4 w-4 mr-2" />
          Go
        </Button>
      </div>
    </div>
  );
}

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
        <div>
          <PageTitle size="lg" alignment="left">
            star feed
          </PageTitle>
        </div>

        {/* Month and Year Selector */}
        <div className="flex justify-between items-center flex-col sm:flex-row">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/starred-articles"
            onPageChange={handlePageChange}
            className="mb-6"
          />
          <MonthYearSelector
            onNavigate={handlePageChange}
            totalArticles={totalArticles}
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
    </>
  );
}
