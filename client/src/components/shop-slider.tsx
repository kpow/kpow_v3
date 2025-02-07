import { useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card } from "@/components/ui/card";

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
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  return (
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
  );
}