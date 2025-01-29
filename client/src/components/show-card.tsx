import { ShowAttendance } from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ShowDetailsModal } from "./show-details-modal";
import { useState } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ShowCardProps {
  show: ShowAttendance;
}

// Add ShowCardSkeleton component
export function ShowCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" /> {/* Venue name */}
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                <Skeleton className="h-4 w-32" /> {/* Location */}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <CalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-4 w-24" /> {/* Date */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ShowCard({ show }: ShowCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatShowDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPP");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString; // Fallback to original date string if parsing fails
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-slackey text-lg">{show.venue}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>
                    {show.city}, {show.state}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-1 h-4 w-4" />
              <span>{formatShowDate(show.showdate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShowDetailsModal
        show={show}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
