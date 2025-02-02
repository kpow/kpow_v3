import { useQuery } from "@tanstack/react-query";
import {
  getAttendedShows,
  getShowStats,
  getPaginatedVenues,
  getSetlistStats,
} from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { ShowCard, ShowCardSkeleton } from "@/components/show-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { OnThisDayShows } from "@/components/OnThisDay";

const SHOWS_PER_PAGE = 6;
const VENUES_PER_PAGE = 5;

export default function ShowStats() {
  const username = "koolyp";
  const [showsPage, setShowsPage] = useState(1);
  const [venuesPage, setVenuesPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/shows/stats", username],
    queryFn: () => getShowStats(username),
  });

  const { data: setlistStats, isLoading: setlistStatsLoading } = useQuery({
    queryKey: ["/api/setlist/stats", username],
    queryFn: () => getSetlistStats(username),
  });

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", username, showsPage],
    queryFn: () => getAttendedShows(username, showsPage, SHOWS_PER_PAGE),
  });

  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: ["/api/venues/paginated", username, venuesPage],
    queryFn: () => getPaginatedVenues(username, venuesPage, VENUES_PER_PAGE),
    placeholderData: (previousData) => previousData,
  });

  // Function to render show cards or skeletons
  const renderShowsContent = () => {
    if (showsLoading) {
      return Array.from({ length: SHOWS_PER_PAGE }).map((_, index) => (
        <ShowCardSkeleton key={`skeleton-${index}`} />
      ));
    }
    return showsData?.shows.map((show) => (
      <ShowCard key={show.showid} show={show} />
    ));
  };

  return (
    <div className="container mx-auto p-2">
      <h1 className="text-4xl font-slackey mb-8">phashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Most Visited Venues - Left Column */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-slackey mb-4">venues</h2>
            <div className="space-y-3">
              {venuesData?.venues.map((venue) => (
                <div
                  key={venue.venue}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{venue.venue}</span>
                  <span className="text-muted-foreground">
                    {venue.count} shows
                  </span>
                </div>
              ))}
            </div>
            {venuesData && venuesData.total > VENUES_PER_PAGE && (
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVenuesPage((p) => Math.max(1, p - 1))}
                  disabled={venuesPage === 1 || venuesLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
                >
                  Previous
                </Button>
                <span className="text-sm">Page {venuesPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
                  onClick={() => setVenuesPage((p) => p + 1)}
                  disabled={
                    venuesPage * VENUES_PER_PAGE >= (venuesData?.total || 0) ||
                    venuesLoading
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards - Right Column */}
        <div className="space-y-4">
          <OnThisDayShows />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-slackey mb-2">total shows</h2>
            <div className="text-4xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                stats?.totalShows || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-slackey mb-2">total venues</h2>
            <div className="text-4xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                stats?.uniqueVenues || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-slackey mb-2">total songs</h2>
            <div className="text-4xl font-bold">
              {setlistStatsLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                setlistStats?.uniqueSongs || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shows Grid */}
      <Card>
        <CardContent className="pt-6 p-4">
          <h2 className="text-2xl font-slackey mb-6">shows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderShowsContent()}
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowsPage((p) => Math.max(1, p - 1))}
              disabled={showsPage === 1 || showsLoading}
              className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
            >
              Previous
            </Button>
            <span className="text-sm">Page {showsPage}</span>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              onClick={() => setShowsPage((p) => p + 1)}
              disabled={
                showsPage * SHOWS_PER_PAGE >= (showsData?.total || 0) ||
                showsLoading
              }
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}