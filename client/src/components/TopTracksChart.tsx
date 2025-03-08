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

// Vibrant, distinct colors that work well together
const COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#45B7D1", // Sky Blue
  "#96CEB4", // Sage Green
  "#FFEEAD", // Cream Yellow
  "#D4A5A5", // Dusty Rose
  "#9A67EA", // Purple
  "#F9D423", // Yellow
  "#FF9F1C", // Orange
  "#2AB7CA", // Teal
];

export function TopTracksChart() {
  const { data, isLoading, error } = useQuery<TopTracksResponse>({
    queryKey: ["/api/lastfm/top-tracks"],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top 10 Tracks Over Time</CardTitle>
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

  // Get top 10 tracks only
  const top10Tracks = data.tracks.slice(0, 10);

  // Process data for the chart
  const chartData = top10Tracks[0].playHistory.map((_, weekIndex) => {
    const weekData: any = {
      date: format(new Date(top10Tracks[0].playHistory[weekIndex].from), 'MMM d, yyyy'),
    };

    top10Tracks.forEach((track) => {
      weekData[`${track.artist} - ${track.name}`] = track.playHistory[weekIndex].playcount;
      // Add a cumulative total for each track
      weekData[`${track.artist} - ${track.name} (Total)`] = track.totalPlaycount;
    });

    return weekData;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 p-4 rounded-lg shadow-lg border border-white/10">
          <p className="text-white font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <p className="text-white text-sm">
                  {entry.name.split(" (Total)")[0]}: {entry.value} plays
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top 10 Tracks Over Time</CardTitle>
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
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient
                    key={`gradient-${index}`}
                    id={`gradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.floor(chartData.length / 8)}
                tick={{ fill: '#666' }}
              />
              <YAxis tick={{ fill: '#666' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px",
                }}
              />
              {top10Tracks.map((track, index) => (
                <Area
                  key={`${track.artist} - ${track.name}`}
                  type="monotone"
                  dataKey={`${track.artist} - ${track.name}`}
                  stackId="1"
                  stroke={COLORS[index]}
                  fill={`url(#gradient-${index})`}
                  fillOpacity={1}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}