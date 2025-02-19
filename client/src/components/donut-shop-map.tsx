import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Shop } from '@/types/shop';

// Custom donut shop marker icon
const ShopIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});


interface MapControllerProps {
  shops: Shop[];
  shouldFitBounds: boolean;
  selectedShopId?: string;
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>;
}

// MapController component to handle map updates and marker control
function MapController({ 
  shops, 
  shouldFitBounds,
  selectedShopId,
  markersRef
}: MapControllerProps) {
  const map = useMap();

  // Handle bounds fitting only on initial load or explicit request
  useEffect(() => {
    if (shouldFitBounds && shops.length > 0) {
      const bounds = L.latLngBounds(
        shops.map(shop => [shop.coordinates.latitude, shop.coordinates.longitude])
      );
      const paddedBounds = bounds.pad(0.2);
      map.fitBounds(paddedBounds);
    }
  }, [shouldFitBounds, shops, map]); // Added map dependency

  // Handle selected shop updates
  useEffect(() => {
    if (selectedShopId && markersRef.current[selectedShopId]) {
      const marker = markersRef.current[selectedShopId];
      const shop = shops.find(s => s.id === selectedShopId);
      if (shop) {
        const storedFavorites = JSON.parse(localStorage.getItem('donutLuv') || '[]');
        const isFromFavorites = storedFavorites.some((f: any) => f.id === shop.id);
        
        // Center map on the selected shop with different zoom levels
        map.setView(
          [shop.coordinates.latitude, shop.coordinates.longitude],
          isFromFavorites ? 18 : map.getZoom() // Zoom close only for favorites
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

interface DonutShopMapProps {
  shops: Shop[];
  onShopClick?: (shop: Shop) => void;
  shouldFitBounds?: boolean;
  selectedShopId?: string;
}

export function DonutShopMap({ 
  shops = [], 
  onShopClick,
  shouldFitBounds = false,
  selectedShopId
}: DonutShopMapProps) {
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedFavorites = localStorage.getItem('donutLuv');
    if (storedFavorites) {
      const favoritesArray = JSON.parse(storedFavorites);
      setFavorites(new Set(favoritesArray.map((f: any) => f.id)));
    }
  }, []);

  const toggleFavorite = (shop: Shop) => {
    const storedFavorites = JSON.parse(localStorage.getItem('donutLuv') || '[]');
    const isFavorite = favorites.has(shop.id);

    if (isFavorite) {
      favorites.delete(shop.id);
      const updatedFavorites = storedFavorites.filter((f: any) => f.id !== shop.id);
      localStorage.setItem('donutLuv', JSON.stringify(updatedFavorites));
    } else {
      favorites.add(shop.id);
      const [city, state] = shop.address.split(', ').slice(-2);
      storedFavorites.push({
        id: shop.id,
        name: shop.name,
        city,
        state
      });
      localStorage.setItem('donutLuv', JSON.stringify(storedFavorites));
    }

    setFavorites(new Set(favorites));
    // Dispatch custom event to notify the list component
    window.dispatchEvent(new Event('donutLuvUpdate'));
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden [&_.leaflet-pane]:!z-[1]">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController 
          shops={shops} 
          shouldFitBounds={shouldFitBounds}
          selectedShopId={selectedShopId}
          markersRef={markersRef}
        />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://stamen.com">Stamen Design</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {shops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.coordinates.latitude, shop.coordinates.longitude]}
            icon={ShopIcon}
            ref={(el) => {
              if (el) {
                markersRef.current[shop.id] = el;
              }
            }}
            eventHandlers={{
              click: () => onShopClick?.(shop)
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
                          favorites.has(shop.id) ? "fill-red-500 text-red-500" : ""
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
      </MapContainer>
    </div>
  );
}