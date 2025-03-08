import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type Artist } from "@/types/artist";
import { motion } from "framer-motion";

interface YearlyTopArtistsProps {
  onArtistClick?: (artist: Artist) => void;
  carouselPosition?: "left" | "right";
}

export function YearlyTopArtists({ onArtistClick, carouselPosition = "left" }: YearlyTopArtistsProps) {
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [api, setApi] = useState<CarouselApi>();

  const { data: yearsData, isLoading: isLoadingYears } = useQuery({
    queryKey: ["/api/music/available-years"],
    queryFn: async () => {
      const response = await fetch("/api/music/available-years");
      if (!response.ok) throw new Error("Failed to fetch available years");
      const data = await response.json();
      return data as { years: string[] };
    },
  });

  const { data: artistsData, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["/api/music/top-artists-by-year", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/music/top-artists-by-year/${selectedYear}`);
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
  });

  // Filter artists with images for the carousel
  const artistsWithImages = artistsData?.artists.filter(
    (artist) => artist.imageUrl || artist.artistImageUrl
  ) || [];

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (!api || !artistsWithImages.length) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api, artistsWithImages]);

  if (isLoadingYears || isLoadingArtists) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const CarouselSection = (
    <div className="md:col-span-4 relative min-h-[300px]">
      {artistsWithImages.length > 0 ? (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full h-full"
        >
          <CarouselContent>
            {artistsWithImages.map((artist) => (
              <CarouselItem key={artist.id}>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-[300px]">
                      <img
                        src={artist.imageUrl || artist.artistImageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold">{artist.name}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
          <span className="text-4xl">🎵</span>
        </div>
      )}
    </div>
  );

  const ListingSection = (
    <div className="md:col-span-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-2 md:gap-2">
        {/* Artists 1-5 */}
        {artistsData?.artists.slice(0, 5).map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-muted/100 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onArtistClick?.(artist)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant="default"
                className="font-slackey bg-primary text-primary-foreground text-xs sm:text-sm"
              >
                #{index + 1}
              </Badge>
              <div className="overflow-hidden">
                <h3 className="font-medium text-sm sm:text-base">{artist.name}</h3>
                {/* <p className="text-xs sm:text-sm text-muted-foreground">
                  {artist.playCount?.toLocaleString() || 0} plays
                </p> */}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Artists 6-10 */}
        {artistsData?.artists.slice(5, 10).map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + 5) * 0.1 }}
            className="bg-muted/100 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onArtistClick?.(artist)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant="default"
                className="font-slackey bg-primary text-primary-foreground text-xs sm:text-sm"
              >
                #{index + 6}
              </Badge>
              <div className="overflow-hidden">
                <h3 className="font-medium text-sm sm:text-base">{artist.name}</h3>
                {/* <p className="text-xs sm:text-sm text-muted-foreground">
                  {artist.playCount?.toLocaleString() || 0} plays
                </p> */}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Title and Year Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-slackey">yearly top artists</h2>
        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger className="w-48 font-slackey text-2xl bg-blue-600 hover:bg-blue-700  text-white font-bold py-2 px-4 rounded">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {yearsData?.years.map((year) => (
              <SelectItem
                key={year}
                value={year}
                className="font-slackey"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {carouselPosition === "left" ? (
          <>
            {CarouselSection}
            {ListingSection}
          </>
        ) : (
          <>
            {ListingSection}
            {CarouselSection}
          </>
        )}
      </div>
    </div>
  );
}