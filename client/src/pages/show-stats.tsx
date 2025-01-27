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

  // Query for attended shows with pagination
  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", username, showPage],
    queryFn: () => getAttendedShows(username, showPage, ITEMS_PER_PAGE)
  });

  // Query for all shows to calculate totals
  const { data: allShowsData } = useQuery({
    queryKey: ["/api/shows/attended/all", username],
    queryFn: () => getAttendedShows(username, 1, 1000)
  });

  // Query for selected show's setlist
  const { data: selectedShow, isLoading: setlistLoading } = useQuery<ShowSetlist>({
    queryKey: ["/api/shows/setlist", selectedShowId],
    queryFn: async () => {
      if (!selectedShowId) throw new Error("No show selected");
      console.log("Fetching setlist for show:", selectedShowId);
      const result = await getShowSetlist(selectedShowId);
      console.log("Fetched setlist:", result);
      return result;
    },
    enabled: !!selectedShowId
  });

  const isLoading = showsLoading || !allShowsData;

  // Calculate totals
  const totalShows = allShowsData?.total || 0;
  const totalVenues = allShowsData ? new Set(allShowsData.shows.map(show => show.venue)).size : 0;
  const totalUniqueSongs = selectedShow ? new Set(selectedShow.songs.map(song => song.name)).size : 0;

  const handleShowClick = (showId: string) => {
    console.log("Show clicked:", showId);
    setSelectedShowId(showId);
  };

  const handleCloseModal = () => {
    console.log("Closing modal");
    setSelectedShowId(null);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">Show Statistics</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Shows */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Total Shows</h2>
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : (
                  totalShows
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Venues */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Unique Venues</h2>
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : totalVenues}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unique Songs */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Unique Songs</h2>
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : totalUniqueSongs}
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
        onClose={handleCloseModal}
      />
    </div>
  );
}