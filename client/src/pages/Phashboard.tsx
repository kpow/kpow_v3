import { useQuery } from "@tanstack/react-query";
import {
  getAttendedShows,
  getShowStats,
  getAllVenues,
  getSetlistStats,
  getShowsByVenue,
} from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { ShowCard, ShowCardSkeleton } from "@/components/phashboard/show-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { OnThisDayShows } from "@/components/phashboard/OnThisDay";
import { VenueShowsModal } from "@/components/phashboard/venue-shows-modal";
import { SongStats } from "@/components/phashboard/song-stats";
import { PageTitle } from "@/components/ui/page-title";
import { VenueMap } from "@/components/phashboard/venue-map";
import { SEO } from "@/components/global/SEO";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollList, ScrollListItem } from "@/components/ui/scroll-area";

const SHOWS_PER_PAGE = 6;
const VENUES_PER_PAGE = 5;

export default function ShowStats() {
  const username = "koolyp";
  const [showsPage, setShowsPage] = useState(1);
  const [venuesPage, setVenuesPage] = useState(1);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);

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
    queryKey: ["/api/venues/stats", username],
    queryFn: () => getAllVenues(username),
    staleTime: 0, // Don't cache to ensure fresh data
    refetchOnWindowFocus: true,
  });

  const { data: venueShows } = useQuery({
    queryKey: ["/api/venues/shows", username, selectedVenue],
    queryFn: () =>
      selectedVenue
        ? getShowsByVenue(username, selectedVenue)
        : Promise.resolve([]),
    enabled: !!selectedVenue,
  });

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

  const getPageTitle = () => {
    return "Phish Show Statistics Dashboard | Phashboard";
  };

  const getPageDescription = () => {
    const showCount = stats?.totalShows || 0;
    const venueCount = stats?.uniqueVenues || 0;
    const songCount = setlistStats?.uniqueSongs || 0;
    return `Track ${showCount} Phish shows across ${venueCount} venues and ${songCount} unique songs. Interactive venue mapping, setlist analysis, and show statistics.`;
  };

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
        image="/phash-stats.jpg"
        type="website"
      />
      <div className="container mx-auto p-2">
        <PageTitle size="lg" className="mb-8">
          phashboard
        </PageTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-slackey mb-4">venues</h2>
              <ScrollArea maxHeight="450px">
                {venuesLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                      >
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                ) : venuesData &&
                  venuesData.venues &&
                  venuesData.venues.length > 0 ? (
                  <ScrollList>
                    {venuesData.venues.map((venue, index) => (
                      <ScrollListItem
                        key={venue.venue}
                        className={`flex justify-between items-center p-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}
                        onClick={() => {
                          setSelectedVenue(venue.venue);
                          setIsVenueModalOpen(true);
                        }}
                      >
                        <span className="font-medium">{venue.venue}</span>
                        <span className="text-muted-foreground">
                          {venue.count} shows
                        </span>
                      </ScrollListItem>
                    ))}
                  </ScrollList>
                ) : (
                  <div className="p-3 text-center">No venues found</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <OnThisDayShows />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 m-0 mb-8">
          <div className="md:col-span-2 mr-8">
            <Card className="h-full">
              <CardContent className="p-0 m-0">
                <VenueMap />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
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

        <Card className="mb-8">
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

        <SongStats />

        <VenueShowsModal
          isOpen={isVenueModalOpen}
          onClose={() => {
            setIsVenueModalOpen(false);
            setSelectedVenue(null);
          }}
          venue={selectedVenue || ""}
          shows={venueShows || []}
        />
      </div>
    </>
  );
}
