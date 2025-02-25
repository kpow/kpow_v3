import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DonutLuvShop {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface DonutLuvListProps {
  onCitySelect?: (city: string, state: string, shopId?: string) => void;
}

export function DonutLuvList({ onCitySelect }: DonutLuvListProps) {
  const [favorites, setFavorites] = useState<DonutLuvShop[]>([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("donutLuv");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "donutLuv") {
        updateFavorites();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("donutLuvUpdate", updateFavorites);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("donutLuvUpdate", updateFavorites);
    };
  }, []);

  const updateFavorites = () => {
    const storedFavorites = localStorage.getItem("donutLuv");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  };

  const removeFavorite = (shopId: string) => {
    const updatedFavorites = favorites.filter((shop) => shop.id !== shopId);
    localStorage.setItem("donutLuv", JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
    window.dispatchEvent(new Event("donutLuvUpdate"));
  };

  const handleShopClick = (shop: DonutLuvShop) => {
    if (onCitySelect) {
      onCitySelect(shop.city, shop.state, shop.id);
    }
  };

  return (
    <>
      <div className="w-full min-w-[300px] sm:min-w-[400px] lg:min-w-[500px]">
        <ScrollArea className="w-full rounded-md border min-h-[100px]">
          <div className="p-2">
            <div className="flex flex-wrap gap-2">
              {favorites.map((shop) => (
                <div key={shop.id} className="inline-flex">
                  <Button
                    variant="secondary"
                    className="flex h-[24px] rounded-l-full rounded-r-none"
                    onClick={() => handleShopClick(shop)}
                  >
                    <span className="text-xs">
                      {shop.name} - {shop.city}
                    </span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-[24px] rounded-l-none rounded-r-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(shop.id);
                    }}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}