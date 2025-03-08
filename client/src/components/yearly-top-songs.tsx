import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Song {
  songId: number;
  songName: string;
  artistId: number;
  artistName: string;
  artistImageUrl: string | null;
  playCount: number;
}

interface YearData {
  [key: string]: (Song[] & { yearImage?: string });
}

export function YearlyTopSongs() {
  const { data: songsByYear, isLoading } = useQuery({
    queryKey: ["/api/music/top-songs-by-year"],
    queryFn: async () => {
      const response = await fetch("/api/music/top-songs-by-year");
      if (!response.ok) throw new Error("Failed to fetch top songs by year");
      const data = await response.json();
      return data.songsByYear as YearData;
    },
  });

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
      <h2 className="text-2xl font-bold text-center mb-6">Top Songs By Year</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(songsByYear)
          .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
          .map(([year, songs], idx) => (
            <motion.div
              key={year}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden relative">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{year}</h3>
                      <Badge variant="outline" className="text-xs">
                        Top 5 Songs
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {songs.map((song, index) => (
                        <div
                          key={song.songId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex-1">
                            <span className="font-medium truncate">
                              {index + 1}. {song.songName}
                            </span>
                            <div className="text-muted-foreground text-xs">
                              {song.artistName} • {song.playCount} plays
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Artist Image */}
                  {songs.yearImage && (
                    <div className="absolute bottom-0 right-0 w-24 h-24 overflow-hidden rounded-tl-lg">
                      <img
                        src={songs.yearImage}
                        alt={`Artist from ${year}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/20" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>
    </div>
  );
}