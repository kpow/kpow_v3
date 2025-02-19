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

export function DonutLuvList() {
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

  const removeFavorite = (shopId: string) => {
    const storedFavorites = JSON.parse(localStorage.getItem('donutLuv') || '[]');
    const updatedFavorites = storedFavorites.filter((shop: DonutLuvShop) => shop.id !== shopId);
    localStorage.setItem('donutLuv', JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('donutLuvUpdate'));
  };

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
      <div className="flex flex-wrap gap-2">
        {favorites.map((shop) => (
          <Button
            key={shop.id}
            variant="outline"
            className="flex items-center gap-2 py-1 px-3 rounded-full"
            onClick={() => removeFavorite(shop.id)}
          >
            <span className="text-sm">
              {shop.name} - {shop.city}, {shop.state}
            </span>
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}