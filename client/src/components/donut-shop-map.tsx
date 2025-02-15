import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

// Custom donut shop marker icon
const ShopIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Shop {
  id: string;
  name: string;
  rating: number;
  price?: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image_url?: string;
}

interface MapControllerProps {
  shops: Shop[];
  shouldFitBounds: boolean;
  selectedShopId?: string;
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>;
}

// Component to handle map updates and marker control
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
  }, [shouldFitBounds, shops]); // Added shops dependency to ensure bounds update with new data

  // Handle selected shop updates
  useEffect(() => {
    if (selectedShopId && markersRef.current[selectedShopId]) {
      const marker = markersRef.current[selectedShopId];
      marker.openPopup();
    }
  }, [selectedShopId, map, markersRef]);

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                  <h3 className="text-xl font-bold">{shop.name}</h3>
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