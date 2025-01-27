import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowStats, getPaginatedVenues } from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { ShowCard } from "@/components/show-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const SHOWS_PER_PAGE = 6;
const VENUES_PER_PAGE = 5;

export default function ShowStats() {
  const username = "koolyp";
  const [showsPage, setShowsPage] = useState(1);
  const [venuesPage, setVenuesPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ["/api/shows/stats", username],
    queryFn: () => getShowStats(username)
  });

  const { data: showsData } = useQuery({
    queryKey: ["/api/shows/attended", username, showsPage],
    queryFn: () => getAttendedShows(username, showsPage, SHOWS_PER_PAGE)
  });

  const { data: venuesData } = useQuery({
    queryKey: ["/api/venues/paginated", username, venuesPage],
    queryFn: () => getPaginatedVenues(username, venuesPage, VENUES_PER_PAGE),
    keepPreviousData: true
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">Phashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Stats Card - Left Column */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-slackey mb-2">Total Shows</h2>
              <div className="text-4xl font-bold">
                {stats?.totalShows || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-slackey mb-2">Unique Venues</h2>
              <div className="text-4xl font-bold">
                {stats?.uniqueVenues || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Most Visited Venues - Right Two Columns */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h2 className="text-lg font-slackey mb-4">Most Visited Venues</h2>
            <div className="space-y-3">
              {venuesData?.venues.map((venue) => (
                <div
                  key={venue.venue}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{venue.venue}</span>
                  <span className="text-muted-foreground">{venue.count} shows</span>
                </div>
              ))}
            </div>
            {venuesData && venuesData.total > VENUES_PER_PAGE && (
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVenuesPage(p => Math.max(1, p - 1))}
                  disabled={venuesPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {venuesPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVenuesPage(p => p + 1)}
                  disabled={venuesPage * VENUES_PER_PAGE >= (venuesData?.total || 0)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shows Grid */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-slackey mb-6">Recent Shows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showsData?.shows.map((show) => (
              <ShowCard
                key={show.showid}
                show={show}
              />
            ))}
          </div>
          {showsData && showsData.total > SHOWS_PER_PAGE && (
            <div className="mt-6 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowsPage(p => Math.max(1, p - 1))}
                disabled={showsPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">Page {showsPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowsPage(p => p + 1)}
                disabled={showsPage * SHOWS_PER_PAGE >= (showsData?.total || 0)}
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