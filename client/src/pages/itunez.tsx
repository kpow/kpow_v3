import { useState } from "react";
import { TopArtistsSlider } from "@/components/top-artists-slider";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { ArtistDetailsModal } from "@/components/artist-details-modal";
import { type Artist } from "@/types/artist";

export default function ITunezPage() {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

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
          <h2 className="text-2xl font-bold mb-6">Top Artists</h2>
          <TopArtistsSlider onArtistClick={setSelectedArtist} />
        </Card>

        <ArtistDetailsModal
          artist={selectedArtist}
          isOpen={!!selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
      </div>
    </>
  );
}