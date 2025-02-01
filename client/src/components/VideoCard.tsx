import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  onPlay: () => void;
}

export function VideoCard({ id, title, description, thumbnail, duration, onPlay }: VideoCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
          {duration}
        </div>
      </div>
      <div className="p-4 h-[180px] flex flex-col">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">{description}</p>
        <Button onClick={onPlay} className="w-full mt-auto">
          Play Video
        </Button>
      </div>
    </Card>
  );
}
