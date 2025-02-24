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

function formatDuration(duration: string) {
  if (!duration) return "";
  // Remove PT prefix
  duration = duration.replace("PT", "");

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  // Extract hours, minutes and seconds
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const secondsMatch = duration.match(/(\d+)S/);

  if (hoursMatch) hours = parseInt(hoursMatch[1]);
  if (minutesMatch) minutes = parseInt(minutesMatch[1]);
  if (secondsMatch) seconds = parseInt(secondsMatch[1]);

  // Format the time
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VideoCard({
  id,
  title,
  description,
  thumbnail,
  duration,
  onPlay,
}: VideoCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
          {formatDuration(duration)}
        </div>
      </div>
      <div className="p-4 h-[225px] flex flex-col">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-4 mb-2 flex-1 overflow-hidden">
          {description}
        </p>
        <Button
          onClick={onPlay}
          className="w-3/4 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
        >
          Play Video
        </Button>
      </div>
    </Card>
  );
}
