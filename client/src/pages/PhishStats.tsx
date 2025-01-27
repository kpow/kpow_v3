import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Show {
  id: number;
  date: string;
  venue: string;
  city: string;
  state: string;
  setlist: string[];
}

interface Stats {
  totalShows: number;
  uniqueSongs: number;
  totalSongs: number;
  averageSetLength: number;
}

export default function PhishStats() {
  const [year, setYear] = useState<string>("2024");
  const years = Array.from({ length: 2025 - 1983 }, (_, i) => (2024 - i).toString());

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: [`/api/phish/stats/${year}`],
  });

  const { data: shows } = useQuery<Show[]>({
    queryKey: [`/api/phish/shows/${year}`],
  });

  return (
    <div className="space-y-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-slackey">Phish Stats Hub</h1>
          <Select 
            value={year} 
            onValueChange={setYear}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">{stats.totalShows}</div>
                  <div className="text-sm text-gray-500">Total Shows</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">{stats.uniqueSongs}</div>
                  <div className="text-sm text-gray-500">Unique Songs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">{stats.totalSongs}</div>
                  <div className="text-sm text-gray-500">Total Songs Played</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold mb-2">{stats.averageSetLength.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Average Set Length</div>
                </CardContent>
              </Card>
            </div>

            {shows && shows.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Show History</h2>
                <div className="space-y-4">
                  {shows.map((show) => (
                    <Card key={show.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold">{show.venue}</h3>
                            <p className="text-sm text-gray-500">
                              {show.city}, {show.state}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(show.date), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="text-sm">
                          {show.setlist.map((song, i) => (
                            <span key={i}>
                              {i > 0 && " > "}
                              {song}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">Failed to load stats</div>
        )}
      </div>
    </div>
  );
}