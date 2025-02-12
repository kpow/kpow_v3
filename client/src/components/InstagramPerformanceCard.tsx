import { formatDistanceToNow } from "date-fns";
import { Card } from "./ui/card";

interface InstagramPerformanceCardProps {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  onClick: () => void;
}

export function InstagramPerformanceCard({
  media_url,
  thumbnail_url,
  caption,
  timestamp,
  media_type,
  onClick,
}: InstagramPerformanceCardProps) {
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {media_type === "VIDEO" ? (
          <img
            src={thumbnail_url || media_url}
            alt={caption || "Instagram video"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={media_url}
            alt={caption || "Instagram post"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-xl font-bold font-slackey uppercase text-white mb-2">
          {caption || "No caption"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/80">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
