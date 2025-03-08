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
  const MAX_VISIBLE_CHARACTERS = 720; // Show first 100 characters initially
  
  // Truncate by character count instead of lines
  const visibleBio = showFullBio 
    ? bio 
    : bio.substring(0, MAX_VISIBLE_CHARACTERS) + (bio.length > MAX_VISIBLE_CHARACTERS ? '...' : '');
  
  const hasMoreContent = bio.length > MAX_VISIBLE_CHARACTERS;
  
  return (
    <div className="text-sm leading-relaxed">
      <p>{visibleBio}</p>
      {hasMoreContent && (
        <Button 
          variant="link" 
          size="sm" 
          className="px-0 mt-2 font-bold" 
          onClick={() => setShowFullBio(!showFullBio)}
        >
          {showFullBio ? "Show Less -" : "Show More +"}
        </Button>
      )}
    </div>
  );
};

interface ArtistDetailsModalProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
}

export function ArtistDetailsModal({
  artist,
  isOpen,
  onClose,
  onNavigate,
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
    staleTime: 0, // Ensure fresh data is fetched when modal opens
    retry: 2,
  });

  // Log for debugging
  console.log("Artist modal data:", { 
    providedArtist: artist, 
    fetchedDetails: artistDetails?.artist 
  });

  if (!artist) return null;

  // Create loading skeleton component to reduce DOM jumpiness
  const ArtistDetailsSkeleton = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side Skeleton */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded-lg border border-primary/20">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex flex-col">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-8 mt-1" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex flex-col">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Side Image Skeleton */}
        <div className="md:col-span-1">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>

      {/* Bio Section Skeleton */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      
      {/* Recent Plays Skeleton */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[820px] max-h-[80vh] min-h-[600px] overflow-y-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <DialogHeader className="flex flex-col space-y-2">
          <div className="flex items-center justify-between w-full">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate('prev');
              }}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Previous artist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <DialogTitle className="font-slackey text-2xl text-center">
              {artist.name}
            </DialogTitle>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate('next');
              }}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Next artist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </DialogHeader>

        <motion.div 
          className="space-y-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isLoading ? (
            <ArtistDetailsSkeleton />
          ) : (
            <>
            {/* Stats and Image Section - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stats Section - Left 1/2 */}
            <div className="flex flex-col space-y-3">
              {(artistDetails?.artist.rank || artist.rank) && (
                <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <div className="flex flex-col">
                    <span className="text-xs">Ranking</span>
                    <span className="font-slackey text-2xl">#{artistDetails?.artist.rank || artist.rank}</span>
                  </div>
                </div>
              )}
              {(artistDetails?.artist.playCount || artist.playCount) && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Plays</span>
                    <span className="font-slackey text-l">{artistDetails?.artist.playCount || artist.playCount}</span>
                  </div>
                </div>
              )}

              {(artistDetails?.artist.listeners || artist.listeners) && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Listeners</span>
                    <span className="font-slackey text-l">{artistDetails?.artist.listeners || artist.listeners}</span>
                  </div>
                </div>
              )}

              {(artistDetails?.artist.lastPlayed || artist.lastPlayed) && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Last Played</span>
                    <span className="font-slackey text-l">{format(new Date(artistDetails?.artist.lastPlayed || artist.lastPlayed), "PPP")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Artist Image - Right 1/2 */}
            <div className="md:col-span-1">
              {(artistDetails?.artist.imageUrl || artistDetails?.artist.artistImageUrl || artist.imageUrl || artist.artistImageUrl) && (
                <div className="relative overflow-hidden rounded-lg max-h-[300px]">
                  <motion.img
                    src={artistDetails?.artist.imageUrl || artistDetails?.artist.artistImageUrl || artist.imageUrl || artist.artistImageUrl}
                    alt={artistDetails?.artist.name || artist.name}
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
                {(artistDetails?.artist.bio || artist.bio) && (
                  <>
                    <BioSection bio={artistDetails?.artist.bio || artist.bio} />
                  </>
                )}

                {artistDetails?.artist?.plays && artistDetails.artist.plays.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Headphones className="h-4 w-4 text-primary" />
                      <h4 className="font-slackey text-xl">Recent Plays</h4>
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
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}