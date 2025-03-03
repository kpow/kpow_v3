import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Shop } from "@/types/shop";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import markerIcons, { MarkerColor } from "./markerIcons";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Custom donut shop marker icon
const ShopIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// No replacement - removing unused function

interface MapControllerProps {
  shops: Shop[];
  shouldFitBounds: boolean;
  selectedShopId?: string;
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>;
  cityCoordinates?: { lat: number; lon: number; display_name: string } | null;
}

// MapController component to handle map updates and marker control
function MapController({
  shops,
  shouldFitBounds,
  selectedShopId,
  markersRef,
  cityCoordinates,
}: MapControllerProps) {
  const map = useMap();

  // Handle bounds fitting only on initial load or explicit request
  useEffect(() => {
    if (shouldFitBounds) {
      // Only proceed if we have shops or city coordinates
      if ((shops.length > 0) || (cityCoordinates && cityCoordinates.lat && cityCoordinates.lon)) {
        let bounds = null;
        
        // If we have shops, start with their bounds
        if (shops.length > 0) {
          const shopCoords = shops.map((shop) => [
            shop.coordinates.latitude,
            shop.coordinates.longitude,
          ]);
          bounds = L.latLngBounds(shopCoords);
        }
        
        // If we have city coordinates
        if (cityCoordinates && cityCoordinates.lat && cityCoordinates.lon) {
          const cityPoint = [cityCoordinates.lat, cityCoordinates.lon];
          
          if (bounds) {
            // Add city to existing bounds
            bounds.extend(cityPoint);
          } else {
            // Create bounds from city only - with a small area around it
            bounds = L.latLngBounds([
              [cityCoordinates.lat - 0.05, cityCoordinates.lon - 0.05],
              [cityCoordinates.lat + 0.05, cityCoordinates.lon + 0.05]
            ]);
          }
        }
        
        if (bounds) {
          // Add padding to the bounds for better view
          const paddedBounds = bounds.pad(0.3);
          
          // Use a timeout to ensure the map is ready
          setTimeout(() => {
            map.invalidateSize();
            map.fitBounds(paddedBounds);
          }, 100);
        }
      } else if (cityCoordinates && cityCoordinates.lat && cityCoordinates.lon) {
        // If we only have city coordinates, center on city
        map.setView([cityCoordinates.lat, cityCoordinates.lon], 12);
      }
    }
  }, [shouldFitBounds, shops, map, cityCoordinates]);

  // Handle selected shop updates
  useEffect(() => {
    if (selectedShopId && markersRef.current[selectedShopId]) {
      const marker = markersRef.current[selectedShopId];
      const shop = shops.find((s) => s.id === selectedShopId);
      if (shop) {
        const storedFavorites = JSON.parse(
          localStorage.getItem("donutLuv") || "[]",
        );
        const isFromFavorites = storedFavorites.some(
          (f: any) => f.id === shop.id,
        );

        // Center map on the selected shop with different zoom levels
        map.setView(
          [shop.coordinates.latitude, shop.coordinates.longitude],
          isFromFavorites ? 18 : map.getZoom(), // Zoom close only for favorites
        );
        // Open the marker popup after a short delay to ensure proper rendering
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }
    }
  }, [selectedShopId, shops, map, markersRef]);

  return null;
}

// Add type for city coordinates
interface CityCoordinates {
  lat: number;
  lon: number;
  display_name: string;
}

// Update DonutShopMapProps interface
interface DonutShopMapProps {
  shops: Shop[];
  chainStores?: Shop[];
  onShopClick?: (shop: Shop) => void;
  shouldFitBounds?: boolean;
  selectedShopId?: string;
  currentCity?: string;
  currentState?: string;
}

export function DonutShopMap({
  shops = [],
  chainStores = [],
  onShopClick,
  shouldFitBounds = false,
  selectedShopId,
  currentCity,
  currentState,
}: DonutShopMapProps) {
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showChainStores, setShowChainStores] = useState(false);
  const [cityCoordinates, setCityCoordinates] =
    useState<CityCoordinates | null>(null);

  // Function to fetch city coordinates from Nominatim
  const fetchCityCoordinates = async (city: string, state: string) => {
    try {
      // First try with specific city and state
      const query = `${city}, ${state}, USA`;
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "DonutTourApp/1.0"
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setCityCoordinates({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name,
        });
        console.log("City coordinates found:", data[0].lat, data[0].lon);
      } else {
        // Try again with just the city name
        const fallbackQuery = encodeURIComponent(city);
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${fallbackQuery}&state=${encodeURIComponent(state)}&country=USA&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "DonutTourApp/1.0"
            }
          }
        );
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.length > 0) {
          setCityCoordinates({
            lat: parseFloat(fallbackData[0].lat),
            lon: parseFloat(fallbackData[0].lon),
            display_name: fallbackData[0].display_name,
          });
          console.log("Fallback city coordinates found:", fallbackData[0].lat, fallbackData[0].lon);
        } else {
          console.warn("Could not find coordinates for", city, state);
        }
      }
    } catch (error) {
      console.error("Error fetching city coordinates:", error);
    }
  };

  // Update city coordinates when city/state changes
  useEffect(() => {
    if (currentCity && currentState) {
      fetchCityCoordinates(currentCity, currentState);
    }
  }, [currentCity, currentState]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("donutLuv");
    if (storedFavorites) {
      const favoritesArray = JSON.parse(storedFavorites);
      setFavorites(new Set(favoritesArray.map((f: any) => f.id)));
    }
  }, []);

  const toggleFavorite = (shop: Shop) => {
    const storedFavorites = JSON.parse(
      localStorage.getItem("donutLuv") || "[]",
    );
    const isFavorite = favorites.has(shop.id);

    if (isFavorite) {
      favorites.delete(shop.id);
      const updatedFavorites = storedFavorites.filter(
        (f: any) => f.id !== shop.id,
      );
      localStorage.setItem("donutLuv", JSON.stringify(updatedFavorites));
    } else {
      favorites.add(shop.id);
      const [city, state] = shop.address.split(", ").slice(-2);
      storedFavorites.push({
        id: shop.id,
        name: shop.name,
        city,
        state,
      });
      localStorage.setItem("donutLuv", JSON.stringify(storedFavorites));
    }

    setFavorites(new Set(favorites));
    // Dispatch custom event to notify the list component
    window.dispatchEvent(new Event("donutLuvUpdate"));
  };

  const { BaseLayer } = LayersControl;

  return (
    <div className="relative h-full w-full">
      {/* Map Container - Place it first in the DOM */}
      <div className="h-full w-full rounded-lg overflow-hidden">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          className="z-0" // Explicitly set base z-index
        >
          <MapController
            shops={shops}
            shouldFitBounds={shouldFitBounds}
            selectedShopId={selectedShopId}
            markersRef={markersRef}
            cityCoordinates={cityCoordinates}
          />
          <LayersControl position="topright">
            {/* Stamen Toner Basemap */}
            <BaseLayer checked name="Toner-lite">
              <TileLayer
                url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
              />
            </BaseLayer>

            {/* Default Basemap (Carto Light) */}
            <BaseLayer name="CartoLight">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">Carto</a>, 
                             &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
            </BaseLayer>

            {/* OpenStreetMap Default Basemap */}
            <BaseLayer name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
            </BaseLayer>

            {/* Stamen Toner Basemap */}
            <BaseLayer name="Watercolor">
              <TileLayer
                url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
                attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
              />
            </BaseLayer>
          </LayersControl>

          {/* Add city marker */}
          {cityCoordinates && (
            <Marker
              position={[cityCoordinates.lat, cityCoordinates.lon]}
              icon={markerIcons.green}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="text-lg font-bold">{currentCity}</h3>
                  <p className="text-sm text-gray-600">
                    {cityCoordinates.display_name}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Regular shops */}
          {shops.map((shop) => (
            <Marker
              key={shop.id}
              position={[shop.coordinates.latitude, shop.coordinates.longitude]}
              icon={markerIcons[shop.isNearby ? "blue" : "red"]}
              ref={(el) => {
                if (el) {
                  markersRef.current[shop.id] = el;
                }
              }}
              eventHandlers={{
                click: () => onShopClick?.(shop),
              }}
            >
              <Popup>
                <div className="p-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{shop.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(shop);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.has(shop.id)
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{shop.address}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Rating:</span>
                        <span>{shop.rating} ⭐</span>
                      </div>
                      {shop.price && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Price:</span>
                          <span>{shop.price}</span>
                        </div>
                      )}
                    </div>
                    {shop.image_url && (
                      <img
                        src={shop.image_url}
                        alt={shop.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Chain stores */}
          {showChainStores &&
            chainStores.map((shop) => (
              <Marker
                key={shop.id}
                position={[shop.coordinates.latitude, shop.coordinates.longitude]}
                icon={markerIcons.grey}
                eventHandlers={{
                  click: () => onShopClick?.(shop),
                }}
              >
                <Popup>
                  <div className="p-1">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{shop.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Rating:</span>
                          <span>{shop.rating} ⭐</span>
                        </div>
                        {shop.price && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Price:</span>
                            <span>{shop.price}</span>
                          </div>
                        )}
                      </div>
                      {shop.image_url && (
                        <img
                          src={shop.image_url}
                          alt={shop.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Chain store toggle switch appears below */}
       {/* Chain store toggle switch */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-chains"
            checked={showChainStores}
            onCheckedChange={setShowChainStores}
          />
          <Label htmlFor="show-chains">Show Chain Stores</Label>
        </div>
      </div>
    </div>
  );
}