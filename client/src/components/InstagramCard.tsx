
import { Card } from "./ui/card";
import { formatDistanceToNow } from "date-fns";

interface InstagramCardProps {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  onClick: () => void;
}

export function InstagramCard({
  media_url,
  thumbnail_url,
  caption,
  timestamp,
  media_type,
  onClick,
}: InstagramCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-[1.02]" 
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {media_type === 'VIDEO' ? (
          <img
            src={thumbnail_url || media_url}
            alt={caption || "Instagram video"}
            className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
          />
        ) : (
          <img
            src={media_url}
            alt={caption || "Instagram post"}
            className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
          />
        )}
        {media_type === 'VIDEO' && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
            Video
          </div>
        )}
        {media_type === 'CAROUSEL_ALBUM' && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
            Album
          </div>
        )}
      </div>
      <div className="p-2 h-[100px]">
        <p className="font-slackey text-lg item-left leading-snug text-gray-600 line-clamp-3">
          {caption || "No caption"}
        </p>
      </div>
    </Card>
  );
}
