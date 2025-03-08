
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type Artist } from "@/types/artist";

interface TopArtistsSliderProps {
  onArtistClick?: (artist: Artist) => void;
}

export function TopArtistsSlider({ onArtistClick }: TopArtistsSliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const { data: topArtists, isLoading } = useQuery({
    queryKey: ["/api/music/top-artists"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-artists");
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
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
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current || !api || count === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const clampedPosition = Math.max(0, Math.min(1, position));
    const targetIndex = Math.floor(clampedPosition * count);
    
    api.scrollTo(targetIndex);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
  };

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
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        setApi={setApi}
        className="w-full mb-6"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {topArtists?.artists.map((artist) => (
            <CarouselItem 
              key={artist.id} 
              className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/4"
            >
              <Card
                className="overflow-hidden cursor-pointer transition-all hover:scale-105 relative"
                onClick={() => onArtistClick?.(artist)}
              >
                <CardContent className="p-0">
                  {/* Rank Badge */}
                  {artist.rank && (
                    <Badge 
                      variant="default" 
                      className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground font-bold"
                    >
                      #{artist.rank}
                    </Badge>
                  )}

                  {/* Artist Image */}
                  {(artist.imageUrl || artist.artistImageUrl) ? (
                    <div className="relative h-48">
                      <img
                        src={artist.imageUrl || artist.artistImageUrl}
                        alt={artist.name}
                        className="h-48 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-muted flex items-center justify-center">
                      <span className="text-4xl">🎵</span>
                    </div>
                  )}

                  {/* Artist Info */}
                  <div className="p-2">
                    <h3 className="font-bold truncate">{artist.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-muted-foreground">
                        {artist.playCount?.toLocaleString() || 0} <br/>plays
                      </p>
                      {artist.listeners && (
                        <p className="text-sm text-muted-foreground text-right">
                          {artist.listeners.toLocaleString()} <br />listeners
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Custom Navigation */}
      <div className="flex items-center justify-between w-full gap-4 px-4">
        {/* Previous Button */}
        <button 
          onClick={() => api?.scrollPrev()}
          className="border rounded-md px-4 py-2 bg-white hover:bg-gray-100 transition-colors"
        >
          PREV
        </button>

        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
          onClick={(e) => {
            if (!progressRef.current || !api || count === 0) return;
            const rect = progressRef.current.getBoundingClientRect();
            const position = (e.clientX - rect.left) / rect.width;
            const targetIndex = Math.floor(position * count);
            api.scrollTo(targetIndex);
          }}
        >
          {/* Track Line */}
          <div className="absolute inset-0 bg-indigo-100 rounded-full"></div>
          
          {/* Draggable Handle */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full cursor-grab"
            style={{ 
              left: `calc(${count ? (current / (count - 1)) * 100 : 0}% - 8px)`,
              transition: isDragging ? 'none' : 'left 0.3s ease-out'
            }}
            onMouseDown={handleDragStart}
          ></div>
        </div>

        {/* Next Button */}
        <button 
          onClick={() => api?.scrollNext()}
          className="border rounded-md px-4 py-2 bg-white hover:bg-gray-100 transition-colors"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
