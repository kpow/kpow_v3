import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowSetlist, getVenueStats, type ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ShowCard } from "@/components/show-card";
import { ShowModal } from "@/components/show-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ITEMS_PER_PAGE = 12;

interface SongStat {
  name: string;
  count: number;
  percentage: number;
}

export default function ShowStats() {
  const username = "koolyp";
  const [showPage, setShowPage] = useState(1);
  const [venuePage, setVenuePage] = useState(1);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", username, showPage],
    queryFn: () => getAttendedShows(username, showPage, ITEMS_PER_PAGE)
  });

  const { data: selectedShow, isLoading: setlistLoading } = useQuery({
    queryKey: ["/api/shows/setlist", selectedShowId],
    queryFn: () => (selectedShowId ? getShowSetlist(selectedShowId) : null),
    enabled: !!selectedShowId
  });

  const { data: venueStats, isLoading: venuesLoading } = useQuery({
    queryKey: ["/api/venues", showsData?.shows],
    queryFn: () => getVenueStats(showsData?.shows || [], venuePage, 5),
    enabled: !!showsData?.shows
  });

  const { data: songStats = [], isLoading: songsLoading } = useQuery<SongStat[]>({
    queryKey: ["/api/songs", showsData?.shows],
    queryFn: async () => {
      if (!showsData?.shows) return [];
      const setlists = await Promise.all(
        showsData.shows.map(show => getShowSetlist(show.showid))
      );

      const songCounts = new Map<string, number>();
      let totalSongs = 0;

      setlists.forEach(setlist => {
        setlist.songs.forEach(song => {
          const count = songCounts.get(song.name) || 0;
          songCounts.set(song.name, count + 1);
          totalSongs++;
        });
      });

      return Array.from(songCounts.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / totalSongs) * 100
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!showsData?.shows
  });

  const isLoading = showsLoading || venuesLoading || setlistLoading || songsLoading;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Show Statistics</h1>

      {/* Total Shows */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Total Shows</h2>
            <div className="text-4xl font-bold">
              {isLoading ? (
                <Skeleton className="h-12 w-24 mx-auto" />
              ) : (
                showsData?.total || 0
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Run Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))
            ) : (
              venueStats?.venues.map(({ venue, count }) => (
                <div key={venue} className="flex justify-between items-center">
                  <span className="font-medium">{venue}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))
            )}
          </div>
          {venueStats && venueStats.total > 5 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setVenuePage(p => Math.max(1, p - 1))}
                  disabled={venuePage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setVenuePage(p => p + 1)}
                  disabled={venuePage * 5 >= (venueStats?.total || 0)}
                >
                  Next
                </Button>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Shows Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Shows</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showsData?.shows.map((show) => (
                  <ShowCard
                    key={show.showid}
                    show={show}
                    onClick={() => setSelectedShowId(show.showid)}
                  />
                ))}
              </div>
              {showsData && showsData.total > ITEMS_PER_PAGE && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPage(p => Math.max(1, p - 1))}
                        disabled={showPage === 1}
                      >
                        Previous
                      </Button>
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(showsData.total / ITEMS_PER_PAGE) })
                      .slice(Math.max(0, showPage - 2), showPage + 1)
                      .map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setShowPage(i + 1)}
                            isActive={showPage === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPage(p => p + 1)}
                        disabled={showPage * ITEMS_PER_PAGE >= (showsData?.total || 0)}
                      >
                        Next
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Song Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Song Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={songStats.slice(0, 20)} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
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
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {songStats.slice(0, 10).map(stat => (
              <div key={stat.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stat.name}</span>
                  <span className="text-muted-foreground">{stat.count} times</span>
                </div>
                <Progress value={stat.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ShowModal
        show={selectedShow || null}
        isOpen={!!selectedShowId}
        onClose={() => setSelectedShowId(null)}
      />
    </div>
  );
}