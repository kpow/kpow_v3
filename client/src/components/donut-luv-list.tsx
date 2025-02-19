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

  const updateFavorites = () => {
    const storedFavorites = localStorage.getItem('donutLuv');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  };

  useEffect(() => {
    updateFavorites();

    // Listen for storage changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'donutLuv') {
        updateFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event listener for same-window updates
    window.addEventListener('donutLuvUpdate', updateFavorites);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('donutLuvUpdate', updateFavorites);
    };
  }, []);

  const removeFavorite = (e: React.MouseEvent, shopId: string) => {
    e.preventDefault(); // Prevent any default action
    e.stopPropagation(); // Prevent the click from bubbling up to the parent button

    const storedFavorites = JSON.parse(localStorage.getItem('donutLuv') || '[]');
    const updatedFavorites = storedFavorites.filter((shop: DonutLuvShop) => shop.id !== shopId);
    localStorage.setItem('donutLuv', JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('donutLuvUpdate'));
  };

  const handleShopClick = (shop: DonutLuvShop) => {
    if (onCitySelect) {
      onCitySelect(shop.city, shop.state, shop.id);
    }
  };

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
      <div className="flex flex-wrap gap-2">
        {favorites.map((shop) => (
          <Button
            key={shop.id}
            variant="secondary"
            className="flex items-center gap-2 py-0 px-3 rounded-full group relative"
            onClick={() => handleShopClick(shop)}
          >
            <span className="text-xs">
              {shop.name} - {shop.city}
            </span>
            <Heart 
              className="h-4 w-4 fill-red-500 text-red-500 cursor-pointer hover:fill-red-700 hover:text-red-700"
              onClick={(e) => removeFavorite(e, shop.id)}
            />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}