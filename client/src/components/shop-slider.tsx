import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shop } from '@/types/shop';

interface ShopSliderProps {
  shops: Shop[];
  onShopClick: (shop: Shop) => void;
  isLoading?: boolean;
}

export function ShopSlider({ shops, onShopClick, isLoading = false }: ShopSliderProps) {
  // Create skeleton placeholder items
  const skeletonItems = Array(5).fill(0).map((_, index) => (
    <CarouselItem key={`skeleton-${index}`} className="md:basis-1/4 lg:basis-1/5">
      <Card className="relative h-[180px] overflow-hidden">
        <Skeleton className="h-full w-full" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <Skeleton className="h-4 w-3/4 mb-1" />
        </div>
      </Card>
    </CarouselItem>
  ));

  return (
    <div className="w-full px-2 py-0">
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {isLoading ? (
            skeletonItems
          ) : (
            shops.map((shop) => (
              <CarouselItem key={shop.id} className="md:basis-1/4 lg:basis-1/5">
                <Card
                  className="relative h-[180px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
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
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                    <h3 className="text-sm font-semibold mb-1 truncate">
                      {shop.name}
                    </h3>
                  </div>
                </Card>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -left-3" />
        <CarouselNext className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -right-3" />
      </Carousel>
    </div>
  );
}