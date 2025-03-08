import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getSetlistStats } from "@/lib/phish-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const SONGS_PER_PAGE = 10;

interface ShowOccurrence {
  date: string;
  venue: string;
  setlist: string;
  url?: string;
}

function SongStatsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[300px] w-full" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center p-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SongStats() {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: songStats, isLoading } = useQuery({
    queryKey: ["/api/songs/stats"],
    queryFn: () => getSetlistStats("koolyp"),
  });

  const { data: songOccurrences, isLoading: occurrencesLoading } = useQuery({
    queryKey: ["/api/setlist/occurrences", selectedSong],
    queryFn: async () => {
      const response = await fetch(
        `/api/setlist/occurrences/${encodeURIComponent(selectedSong!)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch song occurrences");
      return response.json();
    },
    enabled: !!selectedSong,
  });

  // Transform data for the chart - take top 20 songs
  const chartData = songStats
    ? Object.entries(songStats.songCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 20)
        .map(([name, count]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          count,
        }))
    : [];

  // Calculate pagination
  const sortedSongs = songStats
    ? Object.entries(songStats.songCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      )
    : [];

  const totalPages = Math.ceil(sortedSongs.length / SONGS_PER_PAGE);
  const startIndex = (currentPage - 1) * SONGS_PER_PAGE;
  const paginatedSongs = sortedSongs.slice(
    startIndex,
    startIndex + SONGS_PER_PAGE,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-slackey mb-6">song stats</h2>
        {isLoading ? (
          <SongStatsSkeleton />
        ) : (
          <div className="space-y-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Song</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSongs.map(([song, count]) => (
                  <TableRow
                    key={song}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelectedSong(song)}
                  >
                    <TableCell>{song}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <Dialog
          open={!!selectedSong}
          onOpenChange={() => setSelectedSong(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-slackey">
                {selectedSong}
              </DialogTitle>
            </DialogHeader>
            {occurrencesLoading ? (
              <div className="space-y-4 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {songOccurrences?.map((occurrence: ShowOccurrence) => (
                  <div
                    key={occurrence.date}
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="font-medium">
                      {format(new Date(occurrence.date), "PPP")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {occurrence.venue}
                    </div>
                    <div className="text-sm">{occurrence.setlist}</div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
