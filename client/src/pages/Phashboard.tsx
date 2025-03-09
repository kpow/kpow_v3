import { useQuery } from "@tanstack/react-query";
import {
  getAttendedShows,
  getShowStats,
  getAllVenues,
  getSetlistStats,
  getShowsByVenue,
} from "@/lib/phish-api";
import { useState } from "react";
import { VenueShowsModal } from "@/components/phashboard/venue-shows-modal";
import { SongStats } from "@/components/phashboard/song-stats";
import { PageTitle } from "@/components/ui/page-title";
import { SEO } from "@/components/global/SEO";
import { StatsCards } from "@/components/phashboard/stats-cards";
import { VenuesList } from "@/components/phashboard/venues-list";
import { ShowsGrid } from "@/components/phashboard/shows-grid";
import { MapSection } from "@/components/phashboard/map-section";
import { OnThisDayShows } from "@/components/phashboard/OnThisDay";

const SHOWS_PER_PAGE = 6;

export default function Phashboard() {
  const username = "koolyp";
  const [showsPage, setShowsPage] = useState(1);
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
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: venueShows } = useQuery({
    queryKey: ["/api/venues/shows", username, selectedVenue],
    queryFn: () =>
      selectedVenue ? getShowsByVenue(username, selectedVenue) : Promise.resolve([]),
    enabled: !!selectedVenue,
  });

  const handleVenueSelect = (venue: string) => {
    setSelectedVenue(venue);
    setIsVenueModalOpen(true);
  };

  const getPageTitle = () => "Phish Show Statistics Dashboard | Phashboard";
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
          <VenuesList
            venues={venuesData?.venues}
            loading={venuesLoading}
            onVenueSelect={handleVenueSelect}
          />
          <div className="space-y-4">
            <OnThisDayShows />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 m-0 mb-8">
          <div className="md:col-span-2 mr-8">
            <MapSection />
          </div>
          <StatsCards
            stats={stats}
            setlistStats={setlistStats}
            statsLoading={statsLoading}
            setlistStatsLoading={setlistStatsLoading}
          />
        </div>

        <ShowsGrid
          shows={showsData?.shows}
          loading={showsLoading}
          page={showsPage}
          totalShows={showsData?.total || 0}
          showsPerPage={SHOWS_PER_PAGE}
          onPageChange={setShowsPage}
        />

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