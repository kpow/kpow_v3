import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { ShowAttendance } from "@/lib/phish-api";
import { CalendarDays } from "lucide-react";

interface VenueShowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: string;
  shows: ShowAttendance[];
}

export function VenueShowsModal({ isOpen, onClose, venue, shows }: VenueShowsModalProps) {
  const formatShowDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPP");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-slackey">{venue}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {shows.map((show) => (
            <div
              key={show.showid}
              className="p-4 rounded-lg bg-muted/50 flex items-center space-x-3"
            >
              <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span>{formatShowDate(show.showdate)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
