import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface PlayHistory {
  from: string;
  to: string;
  playcount: number;
}

interface Track {
  name: string;
  artist: string;
  totalPlaycount: number;
  rank: number;
  url: string;
  firstPlayed: string | null;
  playHistory: PlayHistory[];
}

interface TopTracksResponse {
  tracks: Track[];
}

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c",
  "#d0ed57", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c",
  "#d0ed57", "#ffc658", "#ff7300", "#8884d8", "#83a6ed",
  "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658"
];

export function TopTracksChart() {
  const { data, isLoading, error } = useQuery<TopTracksResponse>({
    queryKey: ["/api/lastfm/top-tracks"],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top 20 Tracks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
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

  // Process data for the chart
  const chartData = data.tracks[0].playHistory.map((_, weekIndex) => {
    const weekData: any = {
      date: format(new Date(data.tracks[0].playHistory[weekIndex].from), 'MMM d, yyyy'),
    };

    data.tracks.forEach((track, trackIndex) => {
      weekData[`${track.artist} - ${track.name}`] = track.playHistory[weekIndex].playcount;
    });

    return weekData;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top 20 Tracks Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis />
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
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px",
                }}
              />
              {data.tracks.map((track, index) => (
                <Area
                  key={`${track.artist} - ${track.name}`}
                  type="monotone"
                  dataKey={`${track.artist} - ${track.name}`}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}