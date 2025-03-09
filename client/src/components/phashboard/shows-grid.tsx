import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShowCard, ShowCardSkeleton } from "@/components/phashboard/show-card";

interface Show {
  showid: string;
  // Add other show properties as needed
}

interface ShowsGridProps {
  shows: Show[] | undefined;
  loading: boolean;
  page: number;
  totalShows: number;
  showsPerPage: number;
  onPageChange: (page: number) => void;
}

export function ShowsGrid({
  shows,
  loading,
  page,
  totalShows,
  showsPerPage,
  onPageChange,
}: ShowsGridProps) {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6 p-4">
        <h2 className="text-2xl font-slackey mb-6">shows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: showsPerPage }).map((_, index) => (
                <ShowCardSkeleton key={`skeleton-${index}`} />
              ))
            : shows?.map((show) => <ShowCard key={show.showid} show={show} />)}
        </div>
        <div className="mt-6 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
          >
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
            onClick={() => onPageChange(page + 1)}
            disabled={page * showsPerPage >= (totalShows || 0) || loading}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
