import { useQuery } from "@tanstack/react-query";
import { getAttendedShows, getShowSetlist, calculateSongStats, type ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ShowStats() {
  const username = "koolyp"; // We can make this dynamic later if needed

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

  if (isLoading) {
    return <div className="p-8">Loading show statistics...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Show Statistics</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shows Attended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{shows?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Songs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{songStats.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Most Played Songs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={songStats.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Song Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {songStats.slice(0, 10).map(stat => (
              <div key={stat.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stat.name}</span>
                  <span>{stat.count} times</span>
                </div>
                <Progress value={stat.percentage} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
