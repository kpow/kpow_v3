import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { useLocation } from "wouter";
import { BookCard } from "@/components/BookCard";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { SEO } from "@/components/global/SEO";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { Book, BookResponse, Shelf, ShelvesResponse } from "@/types/books";

function useResponsivePageSize() {
  const [pageSize, setPageSize] = useState(6); // Default to mobile size

  useEffect(() => {
    function updatePageSize() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setPageSize(18); // Large screens
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setPageSize(12); // Medium screens
      } else {
        setPageSize(6); // Mobile
      }
    }

    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  return pageSize;
}

export default function Books({ params }: { params?: { page?: string } }) {
  // Component state for search, filter, and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchInDescription, setSearchInDescription] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState("all");
  const [sortBy, setSortBy] = useState("userRating");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pageToNavigate, setPageToNavigate] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // URL and navigation handling
  const currentPage = params?.page ? parseInt(params.page) : 1;
  const [, setLocation] = useLocation();
  const booksPerPage = useResponsivePageSize();

  // Handle invalid page numbers
  if (params?.page && (isNaN(currentPage) || currentPage < 1)) {
    setLocation("/books");
    return null;
  }

  // Fetch shelves for filtering
  const { data: shelvesData, isLoading: isShelvesLoading } = useQuery<ShelvesResponse>({
    queryKey: ["shelves"],
    queryFn: async () => {
      const response = await fetch("/api/books/shelves", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep for 1 hour
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 500),
    [],
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setSearchQuery(searchInputValue);
    setLocation("/books"); // Reset to page 1
  };

  // Handle "Go to Page" navigation
  const handleGoToPage = () => {
    const pageNum = parseInt(pageToNavigate);
    if (!isNaN(pageNum) && pageNum > 0) {
      setLocation(pageNum === 1 ? "/books" : `/books/page/${pageNum}`);
      setPageToNavigate("");
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchInputValue("");
    setSearchInDescription(false);
    setSelectedShelf("all");
    setSortBy("userRating");
    setSortOrder("desc");
    setLocation("/books");
  };

  // Main data query with all filter parameters
  const { data, isLoading, error } = useQuery<BookResponse>({
    queryKey: [
      "books",
      currentPage,
      booksPerPage,
      searchQuery,
      searchInDescription,
      selectedShelf,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      // Build the query parameters for the API
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: booksPerPage.toString(),
      });

      // Add search parameters if present
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      // Add description search flag if enabled
      if (searchInDescription) {
        queryParams.append("search_description", "true");
      }

      // Add shelf filter if selected (and not "all")
      if (selectedShelf && selectedShelf !== "all") {
        queryParams.append("shelf", selectedShelf);
      }

      // Add sorting parameters
      queryParams.append("sort_by", sortBy);
      queryParams.append("sort_order", sortOrder);

      console.log(`Fetching books with params: ${queryParams.toString()}`);

      const response = await fetch(
        `/api/books/search?${queryParams.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  // Helper functions for SEO and metadata
  const getPageTitle = () => {
    let title = "KPOW Book Collection";

    if (searchQuery) {
      title += ` - Search: ${searchQuery}`;
    }

    if (selectedShelf) {
      title += ` - Shelf: ${selectedShelf}`;
    }

    if (currentPage > 1) {
      title += ` - Page ${currentPage}`;
    }

    return title;
  };

  const getPageDescription = () => {
    if (data?.GoodreadsResponse?.reviews?.[0]?.review) {
      const recentBooks = data.GoodreadsResponse.reviews[0].review
        .slice(0, 3)
        .map((review: Book) => review.book[0]?.title?.[0])
        .join(", ");

      let desc = `Currently reading and recently finished books including: ${recentBooks}.`;

      if (searchQuery) {
        desc += ` Filtered by search: "${searchQuery}"`;
      }

      if (selectedShelf) {
        desc += ` in shelf: ${selectedShelf}`;
      }

      return desc;
    }
    return "Explore my reading list and book recommendations. Updated regularly with new discoveries and favorite reads.";
  };

  const getPreviewImage = () => {
    const firstBook =
      data?.GoodreadsResponse?.reviews?.[0]?.review?.[0]?.book[0];
    return firstBook?.image_url?.[0] ?? "/book-placeholder.png";
  };

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Error loading books
          </h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center flex-col sm:flex-row mb-4">
          <PageTitle size="lg" alignment="left">
            book feed
          </PageTitle>
        </div>
        
        {/* Search and Filter Panel Loading Skeleton */}
        <div className="mb-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Skeleton className="h-10 w-full rounded" />
                </div>
                <Skeleton className="h-10 w-24 rounded" />
              </div>
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-32 rounded" />
                <Skeleton className="h-10 w-24 rounded" />
              </div>
            </div>
          </div>
          
          {/* Advanced Filters Loading Skeleton */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shelf Filter Skeleton */}
            <div>
              <Skeleton className="h-4 w-16 mb-2 rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
            
            {/* Sort By Skeleton */}
            <div>
              <Skeleton className="h-4 w-16 mb-2 rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
            
            {/* Sort Direction Skeleton */}
            <div>
              <Skeleton className="h-4 w-24 mb-2 rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        </div>
        
        {/* Results Count Loading Skeleton */}
        <div className="mb-2 flex justify-between items-center">
          <div className="flex justify-between items-center">
            <div className="flex">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-[80px] rounded" />
                <Skeleton className="h-10 w-12 rounded" />
              </div>
            </div>
            
            <div className="flex flex-col justify-end ml-4">
              <Skeleton className="h-4 w-48 rounded mb-1" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
          
          <div className="flex justify-center gap-2 items-center">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </div>
        
        {/* Books Grid Loading Skeleton */}
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {[...Array(booksPerPage)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Extract data for rendering
  const books = data?.GoodreadsResponse?.reviews?.[0]?.review ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalBooks = pagination?.total ?? 0;
  const shelves = shelvesData?.shelves ?? [];

  // Render the main component
  return (
    <>
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
        image={getPreviewImage()}
        type="books.reads"
      />
      <div className="container mx-auto p-2">
        <div className="flex justify-between items-center flex-col sm:flex-row mb-4">
          <PageTitle size="lg" alignment="left">
            book feed
            {searchQuery && (
              <span className="text-sm font-normal ml-2">
                searching: {searchQuery}
              </span>
            )}
            {selectedShelf && selectedShelf !== "all" && (
              <span className="text-sm font-normal ml-2">
                in shelf: {selectedShelf}
              </span>
            )}
          </PageTitle>
        </div>

        {/* Search and Filter Panel */}
        <div className="mb-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search books by title or author..."
                    className="pl-8"
                    value={searchInputValue}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchClick();
                      }
                    }}
                  />
                  {searchInputValue && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => {
                        setSearchInputValue("");
                        setSearchQuery("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  onClick={handleSearchClick}
                  className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded"
                >
                  <Search className="h-4 w-4 mr-0" />
                  Search
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="search-description"
                  checked={searchInDescription}
                  onCheckedChange={(checked) =>
                    setSearchInDescription(checked === true)
                  }
                />
                <Label htmlFor="search-description" className="text-sm">
                  Include description
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {showFilterPanel ? "Hide Filters" : "Show Filters"}
                </Button>
                {(searchQuery ||
                  searchInDescription ||
                  selectedShelf ||
                  sortBy !== "userRating" ||
                  sortOrder !== "desc") && (
                  <Button variant="outline" onClick={handleResetFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilterPanel && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Shelf Filter */}
              <div>
                <Label
                  htmlFor="shelf-filter"
                  className="text-sm font-medium mb-1 block"
                >
                  Shelf
                </Label>
                {isShelvesLoading ? (
                  <Skeleton className="h-10 w-full rounded" />
                ) : (
                  <Select value={selectedShelf} onValueChange={setSelectedShelf}>
                    <SelectTrigger id="shelf-filter">
                      <SelectValue placeholder="All Shelves" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shelves</SelectItem>
                      {shelves.map((shelf) => (
                        <SelectItem key={shelf.id} value={shelf.name}>
                          {shelf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Sort By */}
              <div>
                <Label
                  htmlFor="sort-by"
                  className="text-sm font-medium mb-1 block"
                >
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="userRating">User Rating</SelectItem>
                    <SelectItem value="averageRating">
                      Average Rating
                    </SelectItem>
                    <SelectItem value="dateRead">Date Read</SelectItem>
                    <SelectItem value="dateAdded">Date Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div>
                <Label
                  htmlFor="sort-order"
                  className="text-sm font-medium mb-1 block"
                >
                  Sort Direction
                </Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex justify-between items-center">
            {/* Go to Page */}
            <div className="flex">
              <div className="flex gap-2">
                <Input
                  id="go-to-page"
                  type="number"
                  min="1"
                  className="w-[80px]"
                  max={totalPages}
                  value={pageToNavigate}
                  onChange={(e) => setPageToNavigate(e.target.value)}
                  placeholder={`1-${totalPages}`}
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
                  onClick={handleGoToPage}
                >
                  Go
                </Button>
              </div>
            </div>

            {/* Summary Info */}
            <div className="flex flex-col justify-end ml-4">
              <div className="text-sm text-gray-500">
                {books.length} of {totalBooks} books{" "}
                {searchQuery && `matching "${searchQuery}"`}
                {selectedShelf &&
                  selectedShelf !== "all" &&
                  ` in shelf "${selectedShelf}"`}
              </div>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/books"
            onPageChange={() => {}}
            className="mb-0"
          />
        </div>

        {/* Book Grid */}
        {books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-1">No books found</h3>
            <p className="text-gray-500 mb-4">
              Try changing your search or filter criteria
            </p>
            <Button onClick={handleResetFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {books.map((review: Book, index: number) => (
              <BookCard
                key={`${currentPage}-${index}`}
                review={review}
                allBooks={books}
                currentIndex={index}
              />
            ))}
          </div>
        )}

        {/* Bottom Pagination */}
        <div className="mt-6">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/books"
            onPageChange={() => {}}
          />
        </div>
      </div>
    </>
  );
}
