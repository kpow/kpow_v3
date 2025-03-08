import { useState } from "react";
import { TopArtistsSlider } from "@/components/top-artists-slider";
import { TopTracksChart } from "@/components/TopTracksChart";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { ArtistDetailsModal } from "@/components/artist-details-modal";
import { type Artist } from "@/types/artist";
import { useQuery } from "@tanstack/react-query";

export default function ITunezPage() {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Fetch all artists for navigation
  const { data: topArtists } = useQuery({
    queryKey: ["/api/music/top-artists"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-artists");
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
  });

  const handleArtistNavigation = (direction: 'next' | 'prev') => {
    if (!topArtists?.artists || !selectedArtist) return;

    const artists = topArtists.artists;
    const currentIndex = artists.findIndex(a => a.id === selectedArtist.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % artists.length;
    } else {
      newIndex = (currentIndex - 1 + artists.length) % artists.length;
    }

    // Preserve scroll position and modal height by saving current scroll position
    const modalContent = document.querySelector('.Dialog__content');
    const scrollPosition = modalContent?.scrollTop || 0;

    // Set the new artist - this will trigger a new query with loading state
    setSelectedArtist(artists[newIndex]);

    // Restore scroll position after state update
    setTimeout(() => {
      if (modalContent) {
        modalContent.scrollTop = 0; // Reset to top for new content
      }
    }, 10);
  };

  return (
    <>
      <SEO
        title="KPOW - Music Analytics"
        description="Explore my music listening habits and favorite artists."
        image="/tunes.jpg"
      />
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <PageTitle size="lg">tunes</PageTitle>
        </div>

        <Card className="p-6">
          <TopArtistsSlider onArtistClick={setSelectedArtist} />
        </Card>

        <Card className="p-6">
          <TopTracksChart />
        </Card>

        <ArtistDetailsModal
          artist={selectedArtist}
          isOpen={!!selectedArtist}
          onClose={() => setSelectedArtist(null)}
          onNavigate={handleArtistNavigation}
        />
      </div>
    </>
  );
}