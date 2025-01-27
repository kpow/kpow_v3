import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowSetlist, getVenueStats, type ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShowCard } from "@/components/show-card";
import { ShowModal } from "@/components/show-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ITEMS_PER_PAGE = 6;
const VENUES_PER_PAGE = 6;

export default function ShowStats() {
  const username = "koolyp";
  const [showPage, setShowPage] = useState(1);
  const [venuePage, setVenuePage] = useState(1);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", username, showPage],
    queryFn: () => getAttendedShows(username, showPage, ITEMS_PER_PAGE)
  });

  const { data: allShowsData } = useQuery({
    queryKey: ["/api/shows/attended/all", username],
    queryFn: () => getAttendedShows(username, 1, 1000)
  });

  const { data: selectedShow, isLoading: setlistLoading } = useQuery<ShowSetlist>({
    queryKey: ["/api/shows/setlist", selectedShowId],
    queryFn: async () => {
      if (!selectedShowId) throw new Error("No show selected");
      return await getShowSetlist(selectedShowId);
    },
    enabled: !!selectedShowId,
    retry: false
  });

  const { data: venueStats, isLoading: venuesLoading } = useQuery({
    queryKey: ["/api/venues", allShowsData?.shows, venuePage],
    queryFn: () => {
      if (!allShowsData?.shows) return { venues: [], total: 0 };
      return getVenueStats(allShowsData.shows, venuePage, VENUES_PER_PAGE);
    },
    enabled: !!allShowsData?.shows
  });

  const { data: songStats = [], isLoading: songsLoading } = useQuery({
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

  const isLoading = showsLoading || venuesLoading || songsLoading || setlistLoading;

  // Calculate total venues and songs
  const totalVenues = venueStats?.venues.reduce((sum, venue) => sum + venue.count, 0) || 0;
  const totalSongs = songStats.reduce((sum, song) => sum + song.count, 0) || 0;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">Show Statistics</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Shows */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Total Shows</h2>
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : (
                  allShowsData?.total || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Venues */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Total Venues</h2>
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : totalVenues}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Songs */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-slackey mb-2">Total Songs</h2>
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : totalSongs}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shows Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-slackey">Shows</CardTitle>
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
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPage(p => Math.max(1, p - 1))}
                    disabled={showPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">Page {showPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPage(p => p + 1)}
                    disabled={showPage * ITEMS_PER_PAGE >= (showsData?.total || 0)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Song Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="font-slackey">Song Statistics</CardTitle>
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

      {/* Show Modal */}
      <ShowModal
        show={selectedShow || null}
        isOpen={!!selectedShowId}
        onClose={() => setSelectedShowId(null)}
      />
    </div>
  );
}