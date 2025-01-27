import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowStats, getPaginatedVenues, getSetlistStats } from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { ShowCard } from "@/components/show-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const SHOWS_PER_PAGE = 6;
const VENUES_PER_PAGE = 5;

export default function ShowStats() {
  const [showsPage, setShowsPage] = useState(1);
  const [venuesPage, setVenuesPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/runs/stats"],
    queryFn: () => getShowStats(),
  });

  const { data: setlistStats, isLoading: setlistStatsLoading } = useQuery({
    queryKey: ["/api/songs/stats"],
    queryFn: () => getSetlistStats(),
  });

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: [`/api/shows?page=${showsPage}&limit=${SHOWS_PER_PAGE}`],
    queryFn: () => getAttendedShows(showsPage, SHOWS_PER_PAGE),
  });

  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: [`/api/venues/stats?page=${venuesPage}&limit=${VENUES_PER_PAGE}`],
    queryFn: () => getPaginatedVenues(venuesPage, VENUES_PER_PAGE),
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">phashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Most Visited Venues - Left Column */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-slackey mb-4">venues</h2>
            <div className="space-y-3">
              {venuesLoading ? (
                Array.from({ length: VENUES_PER_PAGE }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))
              ) : (
                venuesData?.items.map((venue) => (
                  <div
                    key={venue.venue}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">{venue.venue}</span>
                    <span className="text-muted-foreground">
                      {venue.count} shows
                    </span>
                  </div>
                ))
              )}
            </div>
            {venuesData?.pagination.hasMore && (
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVenuesPage((p) => Math.max(1, p - 1))}
                  disabled={venuesPage === 1 || venuesLoading}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {venuesPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVenuesPage((p) => p + 1)}
                  disabled={!venuesData?.pagination.hasMore || venuesLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards - Right Column */}
        <div className="space-y-4">
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
      </div>

      {/* Shows Grid */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-slackey mb-6">shows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showsLoading ? (
              Array.from({ length: SHOWS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))
            ) : (
              showsData?.items.map((show) => (
                <ShowCard key={show.showid} show={show} />
              ))
            )}
          </div>
          {showsData?.pagination.hasMore && (
            <div className="mt-6 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowsPage((p) => Math.max(1, p - 1))}
                disabled={showsPage === 1 || showsLoading}
              >
                Previous
              </Button>
              <span className="text-sm">Page {showsPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowsPage((p) => p + 1)}
                disabled={!showsData?.pagination.hasMore || showsLoading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}