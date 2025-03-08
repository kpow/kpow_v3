import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Track {
  name: string;
  artist: string;
  playcount: number;
  rank: number;
  url: string;
  firstPlayed: string | null;
}

interface TopTracksResponse {
  tracks: Track[];
}

export function TopTracksChart() {
  const { data, isLoading, error } = useQuery<TopTracksResponse>({
    queryKey: ["/api/lastfm/top-tracks"],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top 20 Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading top tracks: {(error as Error).message}
      </div>
    );
  }

  if (!data?.tracks) return null;

  // Sort tracks by playcount for better visualization
  const sortedTracks = [...data.tracks].sort((a, b) => b.playcount - a.playcount);

  // Format data for the chart
  const chartData = sortedTracks.map(track => ({
    name: `${track.name} - ${track.artist}`,
    plays: track.playcount,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top 20 Tracks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 250,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={240}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px",
                }}
                labelStyle={{ color: "white" }}
                itemStyle={{ color: "white" }}
              />
              <Legend />
              <Bar
                dataKey="plays"
                fill="#3b82f6"
                name="Total Plays"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
