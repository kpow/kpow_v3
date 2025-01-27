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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-slackey">{show.venue}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {show.location} - {format(new Date(show.showdate), 'PPP')}
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-4">
          <div className="space-y-6">
            {Object.entries(sets).map(([setName, songs]) => (
              <div key={setName}>
                <h3 className="font-slackey mb-2">Set {setName}</h3>
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
              <div className="mt-6">
                <h3 className="font-slackey mb-2">Show Notes</h3>
                <p className="text-sm text-muted-foreground">{show.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}