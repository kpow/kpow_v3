import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowSetlist, calculateSongStats, type ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ShowStats() {
  const username = "koolyp";

  const { data: shows, isLoading: showsLoading } = useQuery({
    queryKey: ["/api/shows/attended", username],
    queryFn: () => getAttendedShows(username)
  });

  const { data: setlists = [], isLoading: setlistsLoading } = useQuery({
    queryKey: ["/api/shows/setlists", shows],
    queryFn: async () => {
      if (!shows) return [];
      const setlists = await Promise.all(
        shows.map(show => getShowSetlist(show.showid))
      );
      return setlists;
    },
    enabled: !!shows
  });

  const songStats = calculateSongStats(setlists);
  const isLoading = showsLoading || setlistsLoading;

  // Calculate venue statistics
  const venueStats = shows?.reduce((acc: Record<string, number>, show) => {
    acc[show.venue] = (acc[show.venue] || 0) + 1;
    return acc;
  }, {}) || {};

  const sortedVenueStats = Object.entries(venueStats)
    .sort(([, a], [, b]) => b - a)
    .map(([venue, count]) => ({ venue, count }));

  if (isLoading) {
    return <div className="p-8">Loading show statistics...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Show Statistics</h1>

      {/* Total Shows */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Total Shows</h2>
            <div className="text-4xl font-bold">{shows?.length || 0}</div>
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
            {sortedVenueStats.slice(0, 5).map(({ venue, count }) => (
              <div key={venue} className="flex justify-between items-center">
                <span className="font-medium">{venue}</span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
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
    </div>
  );
}