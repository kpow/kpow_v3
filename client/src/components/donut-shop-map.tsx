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

// Component to handle map bounds updates
function MapUpdater({ shops, searchId }: { shops: Shop[], searchId: string }) {
  const map = useMap();

  // Update markers whenever shops change
  useEffect(() => {
    if (shops.length === 0) return;

    // Only update bounds when searchId changes (new search performed)
    if (searchId) {
      const bounds = L.latLngBounds(
        shops.map(shop => [shop.coordinates.latitude, shop.coordinates.longitude])
      );
      map.fitBounds(bounds.pad(0.2)); // 20% padding
    }
  }, [shops, searchId, map]); // Keep shops dependency for marker updates

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
  searchId: string;
  onShopClick?: (shop: Shop) => void;
}

export function DonutShopMap({ 
  shops = [], 
  searchId,
  onShopClick 
}: DonutShopMapProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden [&_.leaflet-pane]:!z-[1]">
      <MapContainer
        center={[40.7128, -74.0060]} // Default center (NYC)
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater shops={shops} searchId={searchId} />
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
                <h3 className="font-bold mb-1">{shop.name}</h3>
                <p className="text-sm mb-1">Rating: {shop.rating} ⭐</p>
                {shop.price && (
                  <p className="text-sm mb-1">Price: {shop.price}</p>
                )}
                <p className="text-sm">{shop.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}