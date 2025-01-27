import { ShowAttendance, ShowSetlist } from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ShowCardProps {
  show: ShowAttendance;
  onClick: () => void;
}

export function ShowCard({ show, onClick }: ShowCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{show.venue}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                <span>{show.city}, {show.state}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-1 h-4 w-4" />
            <span>{format(new Date(show.showdate), 'PPP')}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={onClick}>
            View Setlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
