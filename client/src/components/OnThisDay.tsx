import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import { format } from "date-fns";
import { useState } from "react";
import { ShowDetailsModal } from "./show-details-modal";
import { ShowAttendance } from "@/lib/phish-api";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "./ui/select";

async function getShowsOnDate(month: number, day: number) {
  const response = await fetch(`/api/shows/on-date?month=${month}&day=${day}`);
  if (!response.ok) {
    throw new Error('Failed to fetch shows');
  }
  const data = await response.json();
  console.log('Shows on this day:', data);
  return data;
}

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function OnThisDayShows() {
  const [selectedShow, setSelectedShow] = useState<ShowAttendance | null>(null);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());

  const { data: shows, isLoading, error } = useQuery({
    queryKey: ["shows-on-date", month, day],
    queryFn: () => getShowsOnDate(month, day),
  });

  // Get maximum days for the selected month
  const getDaysInMonth = (month: number) => {
    return new Date(2025, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
        <div className="flex flex-col items-center justify-between mb-4">
          <h2 className="text-lg font-slackey mb-4">on this day</h2>
          <div className="flex gap-2">
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={day.toString()}
              onValueChange={(value) => setDay(parseInt(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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