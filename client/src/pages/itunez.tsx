import { useState } from "react";
import { TopArtistsSlider } from "@/components/itunes/top-artists-slider";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/global/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { ArtistDetailsModal } from "@/components/itunes/artist-details-modal";
import { YearlyTopMusic } from "@/components/itunes/yearly-top-music";
import { ArtistDataTable } from "@/components/itunes/artist-data-table";
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

    setSelectedArtist(artists[newIndex]);
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

        <Card className="p-4">
          <TopArtistsSlider onArtistClick={setSelectedArtist} />
        </Card>

        <Card className="p-4">
          <YearlyTopMusic
            onArtistClick={setSelectedArtist}
          />
        </Card>

        <Card className="p-4">
          <ArtistDataTable onArtistClick={setSelectedArtist} />
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