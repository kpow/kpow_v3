import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowSetlist, type ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShowCard } from "@/components/show-card";
import { ShowModal } from "@/components/show-modal";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 6;

export default function ShowStats() {
  const username = "koolyp";
  const [showPage, setShowPage] = useState(1);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  // Query for all shows first (no pagination) to calculate totals
  const { data: allShowsData, isLoading: allShowsLoading } = useQuery({
    queryKey: ["/api/shows/attended/all", username],
    queryFn: () => getAttendedShows(username, 1, 1000),
    staleTime: Infinity // Prevent unnecessary refetches
  });

  // Query for paginated shows for display
  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", username, showPage],
    queryFn: () => getAttendedShows(username, showPage, ITEMS_PER_PAGE)
  });

  // Query for selected show's setlist
  const { data: selectedShow, isLoading: setlistLoading } = useQuery<ShowSetlist>({
    queryKey: ["/api/shows/setlist", selectedShowId],
    queryFn: async () => {
      if (!selectedShowId) throw new Error("No show selected");
      return await getShowSetlist(selectedShowId);
    },
    enabled: !!selectedShowId
  });

  // Query for all setlists to calculate total unique songs
  // Using only first 20 shows to avoid too many API calls
  const { data: allSetlists } = useQuery({
    queryKey: ["/api/shows/setlists/all"],
    queryFn: async () => {
      if (!allShowsData?.shows) return [];
      const showsToFetch = allShowsData.shows.slice(0, 20); // limit to first 20 shows
      return Promise.all(
        showsToFetch.map(show => getShowSetlist(show.showid))
      );
    },
    enabled: !!allShowsData?.shows,
    staleTime: Infinity // Prevent unnecessary refetches
  });

  const isLoading = allShowsLoading || showsLoading;

  // Calculate totals from the complete dataset (not paginated)
  const totalShows = allShowsData?.total || 0;
  const totalVenues = allShowsData ? new Set(allShowsData.shows.map(show => show.venue)).size : 0;
  const totalUniqueSongs = allSetlists ? new Set(
    allSetlists.flatMap(setlist => setlist.songs.map(song => song.name))
  ).size : 0;

  const handleShowClick = (showId: string) => {
    setSelectedShowId(showId);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">Show Statistics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Stats Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h2 className="text-lg font-slackey mb-2">Total Shows</h2>
                <div className="text-4xl font-bold">
                  {isLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : totalShows}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-slackey mb-2">Total Venues</h2>
                <div className="text-4xl font-bold">
                  {isLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : totalVenues}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-slackey mb-2">Unique Songs</h2>
                <div className="text-4xl font-bold">
                  {isLoading ? <Skeleton className="h-12 w-24 mx-auto" /> : totalUniqueSongs}
                </div>
              </div>
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
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showsData?.shows.map((show) => (
                  <ShowCard
                    key={show.showid}
                    show={show}
                    onClick={() => handleShowClick(show.showid)}
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
            </>
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