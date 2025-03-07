import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Music, Calendar, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { type Artist } from "@/types/artist";

interface ArtistDetailsModalProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtistDetailsModal({
  artist,
  isOpen,
  onClose,
}: ArtistDetailsModalProps) {
  const { data: artistDetails, isLoading } = useQuery({
    queryKey: ["/api/music/artists", artist?.id],
    queryFn: async () => {
      const response = await fetch(`/api/music/artists/${artist?.id}`);
      if (!response.ok) throw new Error('Failed to fetch artist details');
      const data = await response.json();
      return data as { artist: Artist };
    },
    enabled: !!artist?.id && isOpen,
  });

  if (!artist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-slackey text-2xl">
            {artist.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {artist.image && (
            <img
              src={artist.image}
              alt={artist.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          <div className="flex items-center text-muted-foreground">
            <PlayCircle className="mr-2 h-4 w-4" />
            <span>Total Plays: {artist.playCount}</span>
          </div>

          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Last Played: {format(new Date(artist.lastPlayed), "PPP")}</span>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-4 w-4" />
              <h3 className="text-lg font-semibold">About</h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {artist.bio}
                </p>

                {artistDetails?.artist?.plays && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Recent Plays:</h4>
                    <ul className="space-y-2">
                      {artistDetails.artist.plays.map((play) => (
                        <li key={play.id} className="text-sm text-muted-foreground">
                          {play.trackName} - {format(new Date(play.playedAt), "PP")}
                        </li>
                      ))}
                    </ul>
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