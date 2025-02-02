import { useLocation } from "wouter";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // e.g., "/books" or "/videos"
  onPageChange?: (page: number) => void;
  className?: string;
}

export function CustomPagination({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
  className = "",
}: PaginationProps) {
  const [, setLocation] = useLocation();

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLocation(newPage === 1 ? baseUrl : `${baseUrl}/page/${newPage}`);
      onPageChange?.(newPage);
    }
  };

  return (
    <div className={`flex justify-center gap-2 items-center ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm">
        {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-1 px-2 rounded"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
