import { useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  orientation?: 'horizontal' | 'vertical';
}

export function ShopSlider({ shops, onShopClick, orientation = 'horizontal' }: ShopSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    direction: orientation === 'vertical' ? 'vertical' : 'horizontal',
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col gap-4">
        {shops.map((shop) => (
          <Card 
            key={shop.id}
            className="relative h-[140px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => onShopClick(shop)}
          >
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
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="text-sm font-semibold mb-1 truncate">
                {shop.name}
              </h3>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="flex-[0_0_180px] min-w-0"
            >
              <Card 
                className="relative h-[140px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => onShopClick(shop)}
              >
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
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
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
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={scrollNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}