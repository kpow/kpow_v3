import { useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  rating: number;
  price?: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image_url?: string;
}

interface ShopSliderProps {
  shops: Shop[];
  onShopClick: (shop: Shop) => void;
}

export function ShopSlider({ shops, onShopClick }: ShopSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      const curIndexes = emblaApi.slidesInView();
      const curIndex = curIndexes[0];
      emblaApi.scrollTo(curIndex - 4);
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      const curIndexes = emblaApi.slidesInView();
      const curIndex = curIndexes[curIndexes.length - 1];
      emblaApi.scrollTo(curIndex);
    }
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full overflow-hidden" ref={emblaRef}>
        <div className="flex gap-2">
          {shops.map((shop) => (
            <div key={shop.id} className="flex-[0_0_220px] min-w-0">
              <Card className="relative h-[180px] overflow-hidden">
                <button
                  onClick={() => onShopClick(shop)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-gray-700" />
                </button>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${
                      shop.image_url ||
                      "https://placehold.co/300x200/jpeg?text=No+Image"
                    })`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                  <h3 className="text-sm font-semibold mb-1 truncate">
                    {shop.name}
                  </h3>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4"
          onClick={scrollNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
