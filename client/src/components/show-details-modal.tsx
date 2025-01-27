import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShowAttendance } from "@/lib/phish-api";
import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";

interface ShowDetailsModalProps {
  show: ShowAttendance | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShowDetailsModal({ show, isOpen, onClose }: ShowDetailsModalProps) {
  if (!show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-slackey text-2xl">{show.venue}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{format(new Date(show.showdate), 'PPP')}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{show.city}, {show.state}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
