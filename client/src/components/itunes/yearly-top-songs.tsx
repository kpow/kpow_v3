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
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { type Artist } from "@/types/artist";
import { MusicDataTable } from "./music-data-table";

interface Song {
  id: number;
  name: string;
  artistId: number;
  artistName: string;
  imageUrl: string | null;
  artistImageUrl: string | null;
  playCount: number;
}

interface YearlyTopSongsProps {
  onArtistClick?: (artist: Artist) => void;
  carouselPosition?: "left" | "right";
}

export function YearlyTopSongs({
  onArtistClick,
  carouselPosition = "left",
}: YearlyTopSongsProps = {}) {
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

  const { data: songsData, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["/api/music/top-songs-by-year", selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/music/top-songs-by-year/${selectedYear}`,
      );
      if (!response.ok) throw new Error("Failed to fetch top songs");
      const data = await response.json();
      return data as { songs: Song[] };
    },
  });

  // Filter songs with images for the carousel
  const songsWithImages =
    songsData?.songs.filter((song) => song.imageUrl || song.artistImageUrl) ||
    [];

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (!api || !songsWithImages.length) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api, songsWithImages]);

  if (isLoadingYears || isLoadingSongs) {
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
      {songsWithImages.length > 0 ? (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full h-full"
        >
          <CarouselContent>
            {songsWithImages.map((song) => (
              <CarouselItem key={song.id}>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-[300px]">
                      <img
                        src={song.imageUrl || song.artistImageUrl}
                        alt={`${song.name} by ${song.artistName}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold">{song.name}</h3>
                        <p className="text-white/80 text-sm">
                          {song.artistName}
                        </p>
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
          <Music className="w-8 h-8 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );

  const ListingSection = (
    <div className="md:col-span-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-2 md:gap-2">
        {/* Songs 1-5 */}
        {songsData?.songs.slice(0, 5).map((song, index) => (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-muted/100 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() =>
              onArtistClick?.({
                id: song.artistId,
                name: song.artistName,
              })
            }
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant="default"
                className="font-slackey bg-primary text-primary-foreground text-xs sm:text-sm"
              >
                #{index + 1}
              </Badge>
              <div className="overflow-hidden">
                <div className="font-bold text-sm sm:text-base">
                  {song.name}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {song.artistName}
                  {/* • {song.playCount.toLocaleString()} plays */}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Songs 6-10 */}
        {songsData?.songs.slice(5, 10).map((song, index) => (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + 5) * 0.1 }}
            className="bg-muted/100 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() =>
              onArtistClick?.({
                id: song.artistId,
                name: song.artistName,
              })
            }
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant="default"
                className="font-slackey bg-primary text-primary-foreground text-xs sm:text-sm"
              >
                #{index + 6}
              </Badge>
              <div className="overflow-hidden">
                <div className="font-bold text-sm sm:text-base">
                  {song.name}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {song.artistName}
                  {/* • {song.playCount.toLocaleString()} plays */}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold font-slackey mr-4">
            yearly top songs
          </h2>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36 font-slackey text-2xl bg-blue-600 hover:bg-blue-700  text-white font-bold py-2 px-4 rounded">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearsData?.years.map((year) => (
                <SelectItem key={year} value={year} className="font-slackey">
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

      <div className="pt-8 border-t">
        <MusicDataTable />
      </div>
    </div>
  );
}