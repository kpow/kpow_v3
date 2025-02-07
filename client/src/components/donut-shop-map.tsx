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

// Component to handle map center updates
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();

  useEffect(() => {
    console.log('Updating map center to:', center);
    map.setView(center, zoom);
  }, [center, zoom, map]);

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
  center?: [number, number];
  zoom?: number;
  onShopClick?: (shop: Shop) => void;
}

export function DonutShopMap({ 
  shops = [], 
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 11, // Changed from 13 to 11 for a wider view
  onShopClick 
}: DonutShopMapProps) {
  console.log('DonutShopMap received:', { shops, center, zoom });

  return (
    <div className="h-full w-full rounded-lg overflow-hidden [&_.leaflet-pane]:!z-[1]">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater center={center} zoom={zoom} />
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