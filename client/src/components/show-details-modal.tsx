import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShowAttendance } from "@/lib/phish-api";
import { format } from "date-fns";
import { AlertCircle, CalendarDays, MapPin, Music } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSetlist } from "@/lib/phish-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShowDetailsModalProps {
  show: ShowAttendance | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShowDetailsModal({ show, isOpen, onClose }: ShowDetailsModalProps) {
  const { data: setlist, isLoading: isLoadingSetlist, error } = useQuery({
    queryKey: ['/api/setlist', show?.showid],
    queryFn: () => getSetlist(show?.showid || ''),
    enabled: !!show?.showid && isOpen,
    retry: 1
  });

  if (!show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-slackey text-2xl">{show.venue}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>{format(new Date(show.showdate), 'PPP')}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{show.city}, {show.state}</span>
            </div>
          </div>

          {isLoadingSetlist ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load setlist. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {show.notes && (
                <div className="text-sm text-muted-foreground">
                  <p>{show.notes}</p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Music className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-2">Setlist:</h3>
                  {setlist && setlist.length > 0 ? (
                    <div className="space-y-4">
                      {Array.from(new Set(setlist.map(song => song.set))).sort().map(set => (
                        <div key={set} className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Set {set}:
                          </h4>
                          <div className="pl-4">
                            {setlist
                              .filter(song => song.set === set)
                              .map((song, idx) => (
                                <span key={`${song.song}-${idx}`} className="text-sm">
                                  {idx > 0 ? ' → ' : ''}{song.song}
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No setlist available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}