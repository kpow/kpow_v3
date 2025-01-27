import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShowSetlist } from "@/lib/phish-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface ShowModalProps {
  show: ShowSetlist | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShowModal({ show, isOpen, onClose }: ShowModalProps) {
  if (!show) return null;

  // Group songs by set
  const sets = show.songs.reduce((acc: Record<string, typeof show.songs>, song) => {
    if (!acc[song.set]) {
      acc[song.set] = [];
    }
    acc[song.set].push(song);
    return acc;
  }, {});

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-slackey">{show.venue}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {show.location} - {format(new Date(show.showdate), 'PPP')}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-grow mt-4">
          <div className="space-y-6 pr-4">
            {Object.entries(sets).map(([setName, songs]) => (
              <div key={setName} className="space-y-2">
                <h3 className="font-slackey">Set {setName}</h3>
                <div className="space-y-1">
                  {songs.map((song, i) => (
                    <div key={`${song.id}-${i}`} className="text-sm">
                      {song.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {show.notes && (
              <div className="space-y-2">
                <h3 className="font-slackey">Show Notes</h3>
                <p className="text-sm text-muted-foreground">{show.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}