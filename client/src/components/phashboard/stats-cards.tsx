import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats: {
    uniqueVenues?: number;
    totalShows?: number;
  } | undefined;
  setlistStats: {
    uniqueSongs?: number;
  } | undefined;
  statsLoading: boolean;
  setlistStatsLoading: boolean;
}

export function StatsCards({
  stats,
  setlistStats,
  statsLoading,
  setlistStatsLoading,
}: StatsCardsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-slackey mb-2">total venues</h2>
          <div className="text-4xl font-bold">
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              stats?.uniqueVenues || 0
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-slackey mb-2">total shows</h2>
          <div className="text-4xl font-bold">
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              stats?.totalShows || 0
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-slackey mb-2">total songs</h2>
          <div className="text-4xl font-bold">
            {setlistStatsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              setlistStats?.uniqueSongs || 0
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
