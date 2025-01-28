import { useQuery } from "@tanstack/react-query";
import { getRecentTracks, type RecentTrack } from "@/lib/lastfm";
import { format } from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TrackCard({ track }: { track: RecentTrack }) {
  const image = track.image.find((img) => img.size === "large") || track.image[0];
  const date = track.date ? new Date(parseInt(track.date.uts) * 1000) : new Date();

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {image && (
          <img
            src={image["#text"]}
            alt={`${track.name} by ${track.artist["#text"]}`}
            className="w-full aspect-square object-cover rounded-md mb-4"
          />
        )}
        <h3 className="font-medium text-base leading-none mb-2 truncate">
          {track.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-1 truncate">
          {track.artist["#text"]}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(date, "MMM d, h:mm a")}
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="w-full aspect-square rounded-md" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export default function RecentlyPlayed() {
  const { data: recentTracks, isLoading } = useQuery<RecentTrack[]>({
    queryKey: ["/api/lastfm/recent-tracks"],
    queryFn: getRecentTracks,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
        <Carousel>
          <CarouselContent>
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                <LoadingSkeleton />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (!recentTracks?.length) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
      <Carousel>
        <CarouselContent>
          {recentTracks.map((track, index) => (
            <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
              <TrackCard track={track} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}