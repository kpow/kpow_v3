import { Card } from "./ui/card";
import { Button } from "./ui/button";
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
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        {media_type === 'VIDEO' ? (
          <img
            src={thumbnail_url || media_url}
            alt={caption || "Instagram video"}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={media_url}
            alt={caption || "Instagram post"}
            className="w-full h-full object-cover"
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
      <div className="p-4 h-[175px] flex flex-col">
        <p className="text-sm text-gray-600 line-clamp-3 mb-2 flex-1">
          {caption || "No caption"}
        </p>
        <div className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </div>
        <Button onClick={onClick} className="w-full mt-4">
          View Post
        </Button>
      </div>
    </Card>
  );
}