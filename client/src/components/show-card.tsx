import { ShowAttendance } from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ShowDetailsModal } from "./show-details-modal";
import { useState } from "react";
import { Button } from "./ui/button";

interface ShowCardProps {
  show: ShowAttendance;
}

export function ShowCard({ show }: ShowCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="cursor-pointer transition-colors hover:bg-accent/50" onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-slackey text-lg">{show.venue}</h3>
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