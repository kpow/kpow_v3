
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

  useEffect(() => {
    // Load visited cities from localStorage
    const storedCities = localStorage.getItem("visitedCities");
    if (storedCities) {
      setVisitedCities(JSON.parse(storedCities));
    }
  }, []);

  const handleCitySelect = (city: string, state: string) => {
    onCitySelect(city, state);
    
    const newCity: VisitedCity = {
      city,
      state,
      timestamp: Date.now(),
    };

    setVisitedCities((prev) => {
      // Check if city already exists
      const exists = prev.some(
        (city) => city.city === newCity.city && city.state === newCity.state
      );

      if (exists) {
        return prev; // Don't add duplicate
      }

      // Add new city at the beginning
      const updated = [newCity, ...prev];
      // Keep only last 55 cities
      const trimmed = updated.slice(0, 55);
      // Save to localStorage
      localStorage.setItem("visitedCities", JSON.stringify(trimmed));
      return trimmed;
    });
  };

  if (visitedCities.length === 0) return null;

  return (
    <ScrollArea className="w-full py-0">
      <div className="flex flex-wrap gap-1">
        {visitedCities.map((city, index) => (
          <Button
            key={`${city.city}-${city.state}-${index}`}
            variant="outline"
            size="xs"
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
