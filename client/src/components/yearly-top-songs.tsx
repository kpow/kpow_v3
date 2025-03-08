import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { type Artist } from "@/types/artist";

interface Song {
  songId: number;
  songName: string;
  artistId: number;
  artistName: string;
  imageUrl: string | null;
  playCount: number;
}

interface YearData {
  [key: string]: Song[];
}

interface YearlyTopSongsProps {
  onArtistClick?: (artist: Artist) => void;
}

export function YearlyTopSongs({ onArtistClick }: YearlyTopSongsProps = {}) {
  const { data: songsByYear, isLoading } = useQuery({
    queryKey: ["/api/music/top-songs-by-year"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-songs-by-year");
      if (!response.ok) throw new Error("Failed to fetch top songs by year");
      const data = await response.json();
      return data.songsByYear as YearData;
    },
  });

  // Helper function to find the first available image URL from the songs list
  const findFirstAvailableImage = (songs: Song[]): string | null => {
    for (const song of songs) {
      if (song.imageUrl) {
        return song.imageUrl;
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!songsByYear) return null;

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(songsByYear)
          .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
          .map(([year, songs], idx) => {
            const yearImage = findFirstAvailableImage(songs);

            return (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="col-span-2 p-4">
                        <div className="flex items-center mb-4">
                          <h3 className="text-xl font-bold mr-4">{year}</h3>
                          <Badge variant="outline" className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2">
                            Top 5 Songs
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {songs.map((song, index) => (
                            <div
                              key={song.songId}
                              className="flex items-center text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-medium block truncate">
                                  {index + 1}. {song.songName}
                                </span>
                                <div className="text-muted-foreground text-xs">
                                  <span 
                                    className="hover:text-primary hover:underline cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onArtistClick) {
                                        // Create minimal artist object with available data
                                        const artist: Artist = {
                                          id: song.artistId,
                                          name: song.artistName,
                                          imageUrl: song.imageUrl,
                                        };
                                        onArtistClick(artist);
                                      }
                                    }}
                                  >
                                    {song.artistName}
                                  </span> • {song.playCount} plays
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Artist Image or Placeholder */}
                      <div className="md:col-span-1 h-40 md:h-full border-t md:border-t-0 md:border-l border-border">
                        {yearImage ? (
                          <img
                            src={yearImage}
                            alt={`Artist from ${year}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Music className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}