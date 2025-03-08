import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Music, Calendar, PlayCircle, Headphones, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { type Artist } from "@/types/artist";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Bio section component with proper hook usage
const BioSection = ({ bio }: { bio: string }) => {
  const [showFullBio, setShowFullBio] = React.useState(false);
  const bioLines = bio.split('\n');
  
  // Show only 2 lines initially (reduced by ~70%)
  const visibleBio = showFullBio 
    ? bio 
    : bioLines.slice(0, 2).join('\n') + (bioLines.length > 2 ? '...' : '');
  
  const hasMoreContent = bioLines.length > 2;
  
  return (
    <div className="text-sm text-muted-foreground leading-relaxed">
      <p>{visibleBio}</p>
      {hasMoreContent && (
        <Button 
          variant="link" 
          size="sm" 
          className="px-0 mt-2" 
          onClick={() => setShowFullBio(!showFullBio)}
        >
          {showFullBio ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
};

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
      <DialogContent className="sm:max-w-[780px] max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <DialogHeader>
          <DialogTitle className="font-slackey text-2xl text-center">
            {artist.name}
          </DialogTitle>
        </DialogHeader>

        <motion.div 
          className="space-y-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Stats and Image Section - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stats Section - Left 1/3 */}
            <div className="flex flex-col space-y-3">
              {artist.playCount && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Plays</span>
                    <span className="font-medium">{artist.playCount}</span>
                  </div>
                </div>
              )}

              {artist.listeners && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Listeners</span>
                    <span className="font-medium">{artist.listeners}</span>
                  </div>
                </div>
              )}

              {artist.lastPlayed && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Last Played</span>
                    <span className="font-medium">{format(new Date(artist.lastPlayed), "PPP")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Artist Image - Right 2/3 */}
            <div className="md:col-span-2">
              {(artist.imageUrl || artist.artistImageUrl) && (
                <div className="relative overflow-hidden rounded-lg h-full">
                  <motion.img
                    src={artist.imageUrl || artist.artistImageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-lg"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">About</h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {artist.bio && (
                  <>
                    <BioSection bio={artist.bio} />
                  </>
                )}

                {artistDetails?.artist?.plays && artistDetails.artist.plays.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Headphones className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Recent Plays</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {artistDetails.artist.plays.map((play, index) => (
                        <motion.div
                          key={play.id}
                          className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <span className="font-medium truncate mr-2">{play.songName}</span>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {format(new Date(play.startTimestamp), "PP")}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}