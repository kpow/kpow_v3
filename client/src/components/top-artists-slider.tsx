import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Artist } from "@/types/artist";

interface TopArtistsSliderProps {
  onArtistClick?: (artist: Artist) => void;
}

export function TopArtistsSlider({ onArtistClick }: TopArtistsSliderProps) {
  const { data: topArtists, isLoading } = useQuery({
    queryKey: ["/api/music/top-artists"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-artists");
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {topArtists?.artists.map((artist) => (
          <CarouselItem 
            key={artist.id} 
            className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/4"
          >
            <Card
              className="overflow-hidden cursor-pointer transition-all hover:scale-105"
              onClick={() => onArtistClick?.(artist)}
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
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  );
}