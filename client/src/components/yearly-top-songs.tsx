import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type Artist } from "@/types/artist";
import { type Song } from "@/types/song";
import { SectionHeader } from "./SectionHeader";
import { CarouselProgressNav } from "./CarouselProgressNav";

interface YearlyTopSongsProps {
  onArtistClick?: (artist: Artist) => void;
  carouselPosition?: "left" | "right";
}

export function YearlyTopSongs({
  onArtistClick,
  carouselPosition = "left",
}: YearlyTopSongsProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [slidePosition, setSlidePosition] = useState(0);

  const { data: years } = useQuery({
    queryKey: ["/api/music/available-years"],
    queryFn: async () => {
      const response = await fetch("/api/music/available-years");
      if (!response.ok) throw new Error("Failed to fetch available years");
      const data = await response.json();
      return data as { years: string[] };
    },
  });

  const selectedYear = years?.years[current] || "2024";

  const { data: topSongsByYear, isLoading } = useQuery({
    queryKey: ["/api/music/top-songs-by-year", selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/music/top-songs-by-year/${selectedYear}`,
      );
      if (!response.ok) throw new Error("Failed to fetch top songs by year");
      const data = await response.json();
      return data as { songs: Song[] };
    },
    enabled: !!selectedYear,
  });

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);

    // Remember the starting slide position
    if (count > 0) {
      const position = current / (count - 1);
      setSlidePosition(position);
    }

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !api || count === 0) return;

    const dragDelta = e.clientX - dragStartX;
    const dragPercentage = dragDelta / window.innerWidth;

    // Calculate the new position based on drag delta
    const newPosition = Math.max(
      0,
      Math.min(1, slidePosition + dragPercentage),
    );
    const targetIndex = Math.round(newPosition * (count - 1));

    if (targetIndex !== current) {
      api.scrollTo(targetIndex);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const top10Songs = topSongsByYear?.songs.slice(0, 10) || [];

  // Split into left and right columns (1-5 in left, 6-10 in right)
  const leftColumnSongs = top10Songs.slice(0, 5);
  const rightColumnSongs = top10Songs.slice(5, 10);

  return (
    <div className="w-full">
      <div
        className={`flex flex-col ${carouselPosition === "right" ? "md:flex-row-reverse" : "md:flex-row"} justify-between mb-6 px-2`}
      >
        <SectionHeader title={`top 10 songs in ${selectedYear}`} />
        <div className="flex items-center mb-4 md:mb-0">
          <CarouselProgressNav
            api={api ?? null}
            current={current}
            count={count}
            isDragging={isDragging}
            onDragStart={handleDragStart}
          />
        </div>
      </div>

      <Carousel className="w-full" setApi={setApi}>
        <CarouselContent>
          {years?.years.map((year) => (
            <CarouselItem key={year}>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column - Songs 1-5 */}
                <div className="space-y-3">
                  {leftColumnSongs.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className="flex items-center cursor-pointer group"
                      onClick={() => song.artistId && onArtistClick?.({ id: song.artistId, name: song.artistName || "" })}
                    >
                      <Badge
                        variant="outline"
                        className="mr-2 w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold group-hover:text-primary truncate">
                          {song.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {song.artistName}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {song.playCount?.toLocaleString() || 0} plays
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right column - Songs 6-10 */}
                <div className="space-y-3">
                  {rightColumnSongs.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className="flex items-center cursor-pointer group"
                      onClick={() => song.artistId && onArtistClick?.({ id: song.artistId, name: song.artistName || "" })}
                    >
                      <Badge
                        variant="outline"
                        className="mr-2 w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
                      >
                        {index + 6}
                      </Badge>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold group-hover:text-primary truncate">
                          {song.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {song.artistName}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {song.playCount?.toLocaleString() || 0} plays
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}