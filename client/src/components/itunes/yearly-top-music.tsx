import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Artist } from "@/types/artist";
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

// Define interface for Song data
interface Song {
  id: number;
  name: string;
  artistId: number;
  artistName: string;
  imageUrl?: string;
  artistImageUrl?: string;
  playCount?: number;
}

type ContentType = "artists" | "songs";

interface YearlyTopMusicProps {
  onArtistClick?: (artist: Artist) => void;
}

export function YearlyTopMusic({ onArtistClick }: YearlyTopMusicProps) {
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [contentType, setContentType] = useState<ContentType>("artists");
  const [api, setApi] = useState<CarouselApi>();

  // Fetch available years
  const { data: yearsData, isLoading: isLoadingYears } = useQuery({
    queryKey: ["/api/music/available-years"],
    queryFn: async () => {
      const response = await fetch("/api/music/available-years");
      if (!response.ok) throw new Error("Failed to fetch available years");
      const data = await response.json();
      return data as { years: string[] };
    },
  });

  // Fetch artists data
  const { data: artistsData, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["/api/music/top-artists-by-year", selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/music/top-artists-by-year/${selectedYear}`
      );
      if (!response.ok) throw new Error("Failed to fetch top artists");
      const data = await response.json();
      return data as { artists: Artist[] };
    },
    enabled: contentType === "artists" || contentType === "songs", // We need artists data for both modes
  });

  // Fetch songs data
  const { data: songsData, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["/api/music/top-songs-by-year", selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/music/top-songs-by-year/${selectedYear}`
      );
      if (!response.ok) throw new Error("Failed to fetch top songs");
      const data = await response.json();
      return data as { songs: Song[] };
    },
    enabled: contentType === "songs", // Only fetch songs when in songs mode
  });

  // Filter items with images for the carousel
  const itemsWithImages = contentType === "artists"
    ? artistsData?.artists.filter(
        (artist) => artist.imageUrl || artist.artistImageUrl
      ) || []
    : songsData?.songs.filter(
        (song) => song.imageUrl || song.artistImageUrl
      ) || [];

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (!api || !itemsWithImages.length) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api, itemsWithImages]);

  // Loading state
  const isLoading = isLoadingYears || 
    (contentType === "artists" && isLoadingArtists) || 
    (contentType === "songs" && isLoadingSongs);

  // Generate listing section based on content type
  const ListingSection = (
    <div className="md:col-span-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-2 md:gap-2">
        {isLoading ? (
          // Loading skeleton for list items
          Array(10)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="bg-muted/100 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            ))
        ) : contentType === "artists" ? (
          // Artists listing
          <>
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
                    <div className="font-bold text-sm sm:text-base">
                      {artist.name}
                    </div>
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
                    <div className="font-bold text-sm sm:text-base">
                      {artist.name}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          // Songs listing
          <>
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
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  // Generate carousel section
  const CarouselSection = (
    <div className="md:col-span-4 relative min-h-[300px]">
      {isLoading ? (
        // Loading skeleton for carousel
        <Skeleton className="w-full h-[300px] rounded-lg" />
      ) : itemsWithImages.length > 0 ? (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full h-full"
        >
          <CarouselContent>
            {contentType === "artists" 
              ? itemsWithImages.map((artist: any) => (
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
              ))
              : itemsWithImages.map((song: any) => (
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
              ))
            }
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
          <span className="text-4xl">🎵</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Title, Content Type Selector, and Year Selector */}
      <div className="flex items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold font-slackey mr-4">top</h2>
        
        {/* Content Type Selector */}
        <Select value={contentType} onValueChange={(value: ContentType) => setContentType(value)}>
          <SelectTrigger className="w-32 font-slackey text-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="artists" className="font-slackey">
              artists
            </SelectItem>
            <SelectItem value="songs" className="font-slackey">
              songs
            </SelectItem>
          </SelectContent>
        </Select>
        
        {/* Year Selector */}
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-36 font-slackey text-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingYears ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : (
              yearsData?.years.map((year) => (
                <SelectItem key={year} value={year} className="font-slackey">
                  {year}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Always display with carousel on right */}
        {ListingSection}
        {CarouselSection}
      </div>
    </div>
  );
}