interface ShowCardProps {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  onClick: () => void;
}

export function ShowCard({
  media_url,
  thumbnail_url,
  caption,
  timestamp,
  media_type,
  onClick,
}: ShowCardProps) {
  return (
    <div className="group relative aspect-[4/3] cursor-pointer">
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {media_type === "VIDEO" ? (
          <img
            src={thumbnail_url || media_url}
            alt={caption || "show clip"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={media_url}
            alt={caption || "show"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-l font-bold font-slackey text-white mb-1">
          {caption || "No caption"}
        </h3>
      </div>
    </div>
  );
}
