import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtistDetailsModal } from "./artist-details-modal";
import { type Artist } from "@/types/artist";

export function TopArtistsSlider() {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: topArtists, isLoading } = useQuery({
    queryKey: ["/api/music/top-artists"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-artists");
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
  });

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {topArtists?.artists.map((artist) => (
          <Card
            key={artist.id}
            className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleArtistClick(artist)}
          >
            <CardContent className="p-0">
              {(artist.imageUrl || artist.artistImageUrl) ? (
                <img
                  src={artist.imageUrl || artist.artistImageUrl}
                  alt={artist.name}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="h-48 w-full bg-muted flex items-center justify-center">
                  <span className="text-4xl">🎵</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold truncate">{artist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {artist.playCount} plays
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ArtistDetailsModal
        artist={selectedArtist}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}