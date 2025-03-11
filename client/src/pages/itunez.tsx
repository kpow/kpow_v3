import { useState } from "react";
import { TopArtistsSlider } from "@/components/itunes/top-artists-slider";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/global/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { ArtistDetailsModal } from "@/components/itunes/artist-details-modal";
import { YearlyTopSongs } from "@/components/itunes/yearly-top-songs";
import { YearlyTopArtists } from "@/components/itunes/yearly-top-artists";
import { type Artist } from "@/types/artist";
import { useQuery } from "@tanstack/react-query";

export default function ITunezPage() {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const { data: topArtists } = useQuery({
    queryKey: ["/api/music/top-artists"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-artists");
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
  });

  const handleArtistNavigation = (direction: "next" | "prev") => {
    if (!topArtists?.artists || !selectedArtist) return;

    const artists = topArtists.artists;
    const currentIndex = artists.findIndex((a) => a.id === selectedArtist.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % artists.length;
    } else {
      newIndex = (currentIndex - 1 + artists.length) % artists.length;
    }

    const modalContent = document.querySelector(".Dialog__content");
    const scrollPosition = modalContent?.scrollTop || 0;

    setSelectedArtist(artists[newIndex]);

    setTimeout(() => {
      if (modalContent) {
        modalContent.scrollTop = 0;
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
      <div className="container mx-auto py-0 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <PageTitle size="lg">my itunez data</PageTitle>
        </div>

        <Card className="p-6">
          <TopArtistsSlider onArtistClick={setSelectedArtist} />
        </Card>

        <Card className="p-6">
          <YearlyTopArtists
            onArtistClick={setSelectedArtist}
            carouselPosition="right"
          />
        </Card>

        <Card className="p-6">
          <YearlyTopSongs
            onArtistClick={setSelectedArtist}
            carouselPosition="left"
          />
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
