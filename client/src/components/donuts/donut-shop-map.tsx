import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/map-styles.css";
import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shop, CityCenter } from "@/types/shop";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import markerIcons from "@/components/donuts/markerIcons";

interface MapControllerProps {
  shops: Shop[];
  shouldFitBounds: boolean;
  selectedShopId?: string;
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>;
  cityCenter: CityCenter | null;
}

function MapController({
  shops,
  shouldFitBounds,
  selectedShopId,
  markersRef,
  cityCenter,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (shouldFitBounds && (shops.length > 0 || cityCenter)) {
      const bounds = L.latLngBounds([]);

      if (cityCenter?.coordinates) {
        bounds.extend([
          cityCenter.coordinates.latitude,
          cityCenter.coordinates.longitude,
        ]);
      }

      shops.forEach((shop) => {
        if (shop.coordinates) {
          bounds.extend([
            shop.coordinates.latitude,
            shop.coordinates.longitude,
          ]);
        }
      });

      if (bounds.isValid()) {
        const paddedBounds = bounds.pad(0.2);
        map.fitBounds(paddedBounds, {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [shouldFitBounds, shops, cityCenter, map]);

  useEffect(() => {
    if (selectedShopId && markersRef.current[selectedShopId]) {
      const marker = markersRef.current[selectedShopId];
      const shop = shops.find((s) => s.id === selectedShopId);

      if (shop?.coordinates) {
        map.setView(
          [shop.coordinates.latitude, shop.coordinates.longitude],
          map.getZoom() || 14
        );
        marker.openPopup();
      }
    }
  }, [selectedShopId, shops, map, markersRef]);

  return null;
}

interface DonutShopMapProps {
  shops: Shop[];
  chainStores?: Shop[];
  onShopClick?: (shop: Shop) => void;
  shouldFitBounds?: boolean;
  selectedShopId?: string;
  cityCenter: CityCenter | null;
  isLoading?: boolean;
}

export function DonutShopMap({
  shops = [],
  chainStores = [],
  onShopClick,
  shouldFitBounds = false,
  selectedShopId,
  cityCenter,
  isLoading = false,
}: DonutShopMapProps) {
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showChainStores, setShowChainStores] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

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
    window.dispatchEvent(new Event("donutLuvUpdate"));
  };

  const { BaseLayer } = LayersControl;

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading shops...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[39.8283, -98.5795]}
            zoom={4}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
            ref={mapRef}
          >
            <MapController
              shops={shops}
              shouldFitBounds={shouldFitBounds}
              selectedShopId={selectedShopId}
              markersRef={markersRef}
              cityCenter={cityCenter}
            />

            <LayersControl position="topright">
              <BaseLayer checked name="Toner-lite">
                <TileLayer
                  url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>'
                />
              </BaseLayer>
              <BaseLayer name="CartoLight">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
              </BaseLayer>
              <BaseLayer name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
              </BaseLayer>
              <BaseLayer name="Watercolor">
                <TileLayer
                  url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
                  attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>'
                />
              </BaseLayer>
            </LayersControl>

            {cityCenter && (
              <>
                <Marker
                  position={[
                    cityCenter.coordinates.latitude,
                    cityCenter.coordinates.longitude,
                  ]}
                  icon={markerIcons.green}
                >
                  <Popup>
                    <div className="p-1">
                      <h3 className="text-lg font-bold">City Center</h3>
                      <p className="text-sm text-gray-600">
                        {cityCenter.display_name}
                      </p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[
                    cityCenter.coordinates.latitude,
                    cityCenter.coordinates.longitude,
                  ]}
                  radius={24150}
                  pathOptions={{
                    fillColor: "#3388ff",
                    fillOpacity: 0.2,
                    weight: 1,
                    color: "#3388ff",
                    opacity: 0.5,
                  }}
                />
              </>
            )}

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

            {showChainStores &&
              chainStores.map((shop) => (
                <Marker
                  key={shop.id}
                  position={[
                    shop.coordinates.latitude,
                    shop.coordinates.longitude,
                  ]}
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
        )}
      </div>

      {!isLoading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-chains"
              checked={showChainStores}
              onCheckedChange={setShowChainStores}
              className="switch data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="show-chains" className="text-black font-bold">
              Show Chain Stores
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}