import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import { format } from "date-fns";
import { useState } from "react";
import { ShowDetailsModal } from "./show-details-modal";
import { ShowAttendance } from "@/lib/phish-api";

async function getShowsOnDate(month: number, day: number) {
  const response = await fetch(`/api/shows/on-date?month=${month}&day=${day}`);
  if (!response.ok) {
    throw new Error('Failed to fetch shows');
  }
  const data = await response.json();
  console.log('Shows on this day:', data); // Debug log
  return data;
}

export function OnThisDayShows() {
  const [selectedShow, setSelectedShow] = useState<ShowAttendance | null>(null);
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth() returns 0-11
  const day = today.getDate();

  const { data: shows, isLoading, error } = useQuery({
    queryKey: ["shows-on-date", month, day],
    queryFn: () => getShowsOnDate(month, day),
  });

  if (error) {
    console.error('Error loading shows:', error);
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-slackey mb-4">on this day</h2>
          <div className="text-red-500">Error loading shows</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-slackey mb-4">on this day</h2>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-muted/50 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-slackey mb-4">on this day</h2>
        <div className="space-y-3">
          {shows && shows.length > 0 ? (
            shows.map((show: ShowAttendance) => (
              <div
                key={show.showid}
                className="flex justify-between items-center p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedShow(show)}
              >
                <div className="space-y-1">
                  <div className="font-medium">{show.venue}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(show.showdate), 'PPP')}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {show.city}, {show.state}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">No shows on this day</div>
          )}
        </div>
      </CardContent>

      <ShowDetailsModal
        show={selectedShow}
        isOpen={!!selectedShow}
        onClose={() => setSelectedShow(null)}
      />
    </Card>
  );
}