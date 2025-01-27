import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowSetlist, type ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShowCard } from "@/components/show-card";
import { ShowModal } from "@/components/show-modal";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 6;
const DEFAULT_USERNAME = "koolyp";

export default function ShowStats() {
  const [showPage, setShowPage] = useState(1);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  // Query for all shows first (no pagination) to calculate totals
  const { data: allShowsData, isLoading: allShowsLoading } = useQuery({
    queryKey: ["/api/shows/attended/all"],
    queryFn: () => getAttendedShows(DEFAULT_USERNAME, 1, 1000),
    staleTime: Infinity
  });

  // Query for paginated shows for display
  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", showPage],
    queryFn: () => getAttendedShows(DEFAULT_USERNAME, showPage, ITEMS_PER_PAGE)
  });

  // Query for selected show's setlist
  const { data: selectedShow } = useQuery<ShowSetlist>({
    queryKey: ["/api/shows/setlist", selectedShowId],
    queryFn: async () => {
      if (!selectedShowId) throw new Error("No show selected");
      return getShowSetlist(selectedShowId);
    },
    enabled: !!selectedShowId
  });

  const isLoading = allShowsLoading || showsLoading;
  const totalShows = allShowsData?.total || 0;
  const totalVenues = allShowsData?.shows ? new Set(allShowsData.shows.map(show => show.venue)).size : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-slackey mb-8">Show Statistics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">Show Statistics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Total Shows</h2>
              <div className="text-4xl font-bold">{totalShows}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Unique Venues</h2>
              <div className="text-4xl font-bold">{totalVenues}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shows Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-slackey">Shows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showsData?.shows.map((show) => (
              <ShowCard
                key={show.showid}
                show={show}
                onClick={() => setSelectedShowId(show.showid)}
              />
            ))}
          </div>
          {showsData && showsData.total > ITEMS_PER_PAGE && (
            <div className="mt-6 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPage(p => Math.max(1, p - 1))}
                disabled={showPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">Page {showPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPage(p => p + 1)}
                disabled={showPage * ITEMS_PER_PAGE >= (showsData?.total || 0)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show Modal */}
      <ShowModal
        show={selectedShow || null}
        isOpen={!!selectedShowId}
        onClose={() => setSelectedShowId(null)}
      />
    </div>
  );
}