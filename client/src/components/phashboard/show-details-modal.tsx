import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShowAttendance } from "@/lib/phish-api";
import { format } from "date-fns";
import { CalendarDays, MapPin, Music } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSetlist } from "@/lib/phish-api";
import { Skeleton } from "@/components/ui/skeleton";

interface ShowDetailsModalProps {
  show: ShowAttendance | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShowDetailsModal({
  show,
  isOpen,
  onClose,
}: ShowDetailsModalProps) {
  const { data: setlist, isLoading: isLoadingSetlist } = useQuery({
    queryKey: ["/api/setlists", show?.showid],
    queryFn: () => getSetlist(show?.showid || ""),
    enabled: !!show?.showid && isOpen,
  });

  if (!show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="font-slackey text-2xl">
            {show.venue}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{format(new Date(show.showdate), "PPP")}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>
              {show.city}, {show.state}
            </span>
          </div>

          {/* Setlist Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Setlist</h3>
            </div>

            {isLoadingSetlist ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {setlist?.setlistdata}
                </div>
                {setlist?.setlistnotes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Show Notes:</h4>
                    <p className="text-sm text-muted-foreground">
                      {setlist.setlistnotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
