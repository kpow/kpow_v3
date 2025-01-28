import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface BookCardProps {
  title: string;
  author: string;
  rating?: number;
  imageUrl: string;
  description?: string;
  date?: string;
  className?: string;
  link?: string;
}

export function BookCard({
  title,
  author,
  rating,
  imageUrl,
  description,
  className,
  link
}: BookCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <a 
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex gap-6 hover:bg-gray-50 p-4 rounded-lg transition-colors",
        className
      )}
    >
      <div className="w-[120px] flex-shrink-0">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      <div className="flex-grow">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">by {author}</p>
        {rating !== undefined && (
          <div className="mt-2">
            {renderStars(rating)}
          </div>
        )}
        {description && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-3">{description}</p>
        )}
      </div>
    </a>
  );
}
