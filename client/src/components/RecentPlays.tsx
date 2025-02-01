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
import { Skeleton } from "@/components/ui/skeleton";

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

export function RecentPlays() {
  const { data, isLoading, error } = useQuery<LastFmResponse>({
    queryKey: ["/api/lastfm/recent-tracks"],
  });

  if (isLoading) {
    return (
      <div className="w-full px-2 py-0">
        <div className="items-center gap-2 mb-4">
          <SiLastdotfm className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Recently Played</h2>
          <div className="w-full p-2">
            <Skeleton
              key="skelly"
              className="md:h-[150px] lg:h-[200px] w-full"
            />
          </div>
        </div>
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
    <div className="w-full px-2 py-0">
      <div className="flex items-center gap-2 mb-4">
        <SiLastdotfm className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Recently Played</h2>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
          slidesToScroll: "auto",
          skipSnaps: true,
          dragFree: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {data.tracks.map((track, index) => (
            <CarouselItem key={index} className="md:basis-1/4 lg:basis-1/5">
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card>
                  <CardContent className="p-0">
                    <div className="relative w-full">
                      <div className="relative aspect-square">
                        <img
                          src={track.image}
                          alt={`${track.album} cover`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <div className="absolute bottom-0 p-3 text-white">
                            <p className="font-semibold text-sm">
                              {track.artist}
                            </p>
                            <p className="text-xs opacity-80">{track.album}</p>
                          </div>
                        </div>
                        {track.nowPlaying && (
                          <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                            Now Playing
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-sm font-medium truncate">
                        {track.name}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -left-3" />
        <CarouselNext className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -right-3" />
      </Carousel>
    </div>
  );
}
