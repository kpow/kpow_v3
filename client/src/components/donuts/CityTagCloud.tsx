import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

interface VisitedCity {
  city: string;
  state: string;
  timestamp: number;
}

interface CityTagCloudProps {
  onCitySelect: (city: string, state: string) => void;
  selectedCity?: { city: string; state: string };
}

export function CityTagCloud({ onCitySelect, selectedCity }: CityTagCloudProps) {
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([]);

  // Remove the saveCity function as it's now handled in DonutShops.tsx

  useEffect(() => {
    const storedCities = localStorage.getItem("visitedCities");
    if (storedCities) {
      setVisitedCities(JSON.parse(storedCities));
    }

    // Add storage event listener to update cities when localStorage changes
    const handleStorageChange = () => {
      const updatedCities = localStorage.getItem("visitedCities");
      if (updatedCities) {
        setVisitedCities(JSON.parse(updatedCities));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen to our custom event
    window.addEventListener('visitedCitiesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visitedCitiesUpdated', handleStorageChange);
    };
  }, []);

  const handleCitySelect = (city: string, state: string) => {
    onCitySelect(city, state);
  };

  if (visitedCities.length === 0) return null;

  return (
    <ScrollArea className="w-full py-0">
      <div className="flex flex-wrap gap-1">
        {visitedCities.map((city, index) => (
          <Button
            key={`${city.city}-${city.state}-${index}`}
            variant="outline"
            size="sm"
            className="flex items-center justify-center bg-gray-300 text-xs text-black font-medium py-1 px-3 rounded-full hover:bg-gray-400 transition-all"
            onClick={() => handleCitySelect(city.city, city.state)}
          >
            {city.city}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}