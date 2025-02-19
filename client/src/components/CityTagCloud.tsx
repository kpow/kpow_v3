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
  currentCity?: { city: string; state: string };
}

export function CityTagCloud({ onCitySelect, currentCity }: CityTagCloudProps) {
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([]);

  useEffect(() => {
    // Load visited cities from localStorage
    const storedCities = localStorage.getItem("visitedCities");
    if (storedCities) {
      setVisitedCities(JSON.parse(storedCities));
    }
  }, []);

  useEffect(() => {
    // Update localStorage when current city changes
    if (currentCity?.city && currentCity?.state) {
      const newCity: VisitedCity = {
        city: currentCity.city,
        state: currentCity.state,
        timestamp: Date.now(),
      };

      setVisitedCities((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter(
          (city) =>
            !(city.city === newCity.city && city.state === newCity.state),
        );

        // Add new city at the beginning
        const updated = [newCity, ...filtered];

        // Keep only last 20 cities
        const trimmed = updated.slice(0, 55);

        // Save to localStorage
        localStorage.setItem("visitedCities", JSON.stringify(trimmed));
        return trimmed;
      });
    }
  }, [currentCity?.city, currentCity?.state]);

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
            onClick={() => onCitySelect(city.city, city.state)}
          >
            {city.city}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
