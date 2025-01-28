import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { SiLastdotfm } from "react-icons/si";

interface Track {
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  date: string | null;
  nowPlaying: boolean;
}

interface LastFmResponse {
  tracks: Track[];
}

export default function RecentPlays() {
  const { data, isLoading, error } = useQuery<LastFmResponse>({
    queryKey: ["/api/lastfm/recent-tracks"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span>Loading recent tracks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading recent tracks: {(error as Error).message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="w-full px-6 py-4">
      <div className="flex items-center gap-2 mb-4">
        <SiLastdotfm className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Recently Played</h2>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {data.tracks.map((track, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card>
                  <CardContent className="flex flex-col p-4">
                    <div className="relative aspect-square mb-3">
                      <img
                        src={track.image}
                        alt={`${track.album} cover`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      {track.nowPlaying && (
                        <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                          Now Playing
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold truncate">{track.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.album}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}