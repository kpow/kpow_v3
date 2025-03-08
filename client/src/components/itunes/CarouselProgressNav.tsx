import { useRef } from "react";
import { type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

interface CarouselProgressNavProps {
  api: CarouselApi | null;
  current: number;
  count: number;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent) => void;
}

export function CarouselProgressNav({
  api,
  current,
  count,
  isDragging,
  onDragStart,
}: CarouselProgressNavProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center gap-4">
      {/* Previous Button */}
      <Button
        onClick={() => api?.scrollPrev()}
        className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
      >
        prev
      </Button>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="relative w-32 md:w-32 lg:w-64 xl:w-64 h-2 bg-gray-200 rounded-full cursor-pointer"
        onClick={(e) => {
          if (!progressRef.current || !api || count === 0) return;
          const rect = progressRef.current.getBoundingClientRect();
          const position = (e.clientX - rect.left) / rect.width;
          const clampedPosition = Math.max(0, Math.min(1, position));
          const targetIndex = Math.round(clampedPosition * (count - 1));
          api.scrollTo(targetIndex);
        }}
      >
        {/* Track Line */}
        <div className="absolute inset-0 bg-indigo-100 rounded-full"></div>

        {/* Tick marks for each 100 */}
        {Array.from({ length: Math.floor(count / 100) + 1 }).map(
          (_, index) => {
            if (count < 100 || index * 100 >= count || index === 0)
              return null;

            const position = ((index * 100) / (count - 1)) * 100;
            return (
              <div
                key={index}
                className="absolute top-[-3px] w-[1px] h-[8px] bg-gray-400"
                style={{
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <span className="absolute top-[-18px] left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500">
                  {index * 100}
                </span>
              </div>
            );
          },
        )}

        {/* Draggable Handle */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full ${isDragging ? "cursor-grabbing" : "cursor-grab"} z-10`}
          style={{
            left: `calc(${count > 1 ? (current / (count - 1)) * 100 : 0}% - 8px)`,
            transition: isDragging ? "none" : "left 0.2s ease-out",
          }}
          onMouseDown={onDragStart}
        ></div>
      </div>

      {/* Next Button */}
      <Button
        onClick={() => api?.scrollNext()}
        className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
      >
        next
      </Button>
    </div>
  );
}