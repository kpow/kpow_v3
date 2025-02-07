import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Custom donut shop marker icon
const ShopIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to handle map center and bounds updates
function MapUpdater({ shops, shouldFitBounds }: { shops: Shop[], shouldFitBounds: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (shouldFitBounds && shops.length > 0) {
      // Create bounds object
      const bounds = L.latLngBounds(
        shops.map(shop => [shop.coordinates.latitude, shop.coordinates.longitude])
      );

      // Add padding to bounds
      const paddedBounds = bounds.pad(0.2); // 20% padding

      // Fit map to bounds
      map.fitBounds(paddedBounds);
    }
  }, [shops, shouldFitBounds, map]);

  return null;
}

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

interface DonutShopMapProps {
  shops: Shop[];
  onShopClick?: (shop: Shop) => void;
  shouldFitBounds?: boolean;
}

export function DonutShopMap({ 
  shops = [], 
  onShopClick,
  shouldFitBounds = false
}: DonutShopMapProps) {
  console.log('DonutShopMap received:', { shops });

  return (
    <div className="h-full w-full rounded-lg overflow-hidden [&_.leaflet-pane]:!z-[1]">
      <MapContainer
        center={[39.8283, -98.5795]} // Geographic center of the continental United States
        zoom={4} // Zoom level to show the continental United States
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater shops={shops} shouldFitBounds={shouldFitBounds} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {shops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.coordinates.latitude, shop.coordinates.longitude]}
            icon={ShopIcon}
            eventHandlers={{
              click: () => onShopClick?.(shop)
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="space-y-4">
                  {shop ? (
                    <>
                      <h3 className="text-xl font-bold">{shop.name}</h3>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Rating:</span>
                        <span>{shop.rating} ⭐</span>
                      </div>
                      {shop.price && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Price:</span>
                          <span>{shop.price}</span>
                        </div>
                      )}
                      {shop.image_url && (
                        <img
                          src={shop.image_url}
                          alt={shop.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">
                      Select a shop on the map to see details
                    </p>
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