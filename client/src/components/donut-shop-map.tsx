
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Create custom colored markers
const markerIcons = {
  red: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  blue: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

// Define chain store names (lowercase for comparison)
const chainStoreNames = [
  'dunkin', 'krispy kreme', 'tim hortons', 'shipley', 'daylight donuts',
  'duck donuts', 'winchell\'s', 'yum yum', 'mighty-o', 'top pot'
];

interface DonutShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  review_count: number;
  url: string;
  price?: string;
  photos?: string[];
  distance?: number;
  isNearby?: boolean;
}

interface CityCoordinates {
  latitude: number;
  longitude: number;
}

interface DonutShopMapProps {
  shops: DonutShop[];
  isLoading: boolean;
  error: Error | null;
  cityCoordinates?: CityCoordinates;
  shouldFitBounds?: boolean;
}

function MapBoundsHandler({ shops, shouldFitBounds }: { shops: DonutShop[], shouldFitBounds?: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (shops.length > 0 && shouldFitBounds) {
      const bounds = L.latLngBounds(shops.map(shop => [shop.coordinates.latitude, shop.coordinates.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [shops, shouldFitBounds, map]);

  return null;
}

export function DonutShopMap({ shops, isLoading, error, cityCoordinates, shouldFitBounds = true }: DonutShopMapProps) {
  const [selectedShop, setSelectedShop] = useState<DonutShop | null>(null);
  const [showChainStores, setShowChainStores] = useState(false);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const { toast } = useToast();

  // Filter shops based on chain status
  const filteredShops = shops.filter(shop => {
    const isChain = chainStoreNames.some(chain => 
      shop.name.toLowerCase().includes(chain)
    );
    return showChainStores || !isChain;
  });

  // Handle marker click
  const handleMarkerClick = (shop: DonutShop) => {
    setSelectedShop(shop);
  };

  // Default center if no shops or city coordinates
  const defaultCenter: [number, number] = cityCoordinates 
    ? [cityCoordinates.latitude, cityCoordinates.longitude]
    : [37.7749, -122.4194]; // San Francisco as default

  // Add to favorites
  const addToFavorites = (shop: DonutShop) => {
    const favoriteShop = {
      id: shop.id,
      name: shop.name,
      city: shop.city,
      state: shop.state
    };
    
    const storedFavorites = localStorage.getItem('donutLuv');
    let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
    
    // Check if already in favorites
    if (favorites.some((fav: any) => fav.id === shop.id)) {
      toast({
        description: `${shop.name} is already in your favorites!`,
      });
      return;
    }
    
    favorites.push(favoriteShop);
    localStorage.setItem('donutLuv', JSON.stringify(favorites));
    
    // Dispatch custom event for other components to listen for
    window.dispatchEvent(new Event('donutLuvUpdate'));
    
    toast({
      description: `Added ${shop.name} to your favorites!`,
    });
  };

  if (isLoading) {
    return <div className="w-full h-[600px] flex items-center justify-center">Loading donut shops...</div>;
  }

  if (error) {
    return <div className="w-full h-[600px] flex items-center justify-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden">
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
      
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredShops.map(shop => (
          <Marker
            key={shop.id}
            position={[shop.coordinates.latitude, shop.coordinates.longitude]}
            icon={markerIcons[shop.isNearby ? 'blue' : 'red']}
            ref={(el) => {
              if (el) {
                markersRef.current[shop.id] = el;
              }
            }}
            eventHandlers={{
              click: () => handleMarkerClick(shop)
            }}
          >
            <Popup>
              <Card className="border-0 shadow-none">
                <CardContent className="p-2">
                  <h3 className="font-bold">{shop.name}</h3>
                  <p className="text-sm">{shop.address}</p>
                  <p className="text-sm">{shop.city}, {shop.state}</p>
                  {shop.price && (
                    <Badge variant="outline" className="mt-1 mr-1">
                      {shop.price}
                    </Badge>
                  )}
                  <Badge variant="outline" className="mt-1">
                    {shop.rating} ★ ({shop.review_count} reviews)
                  </Badge>
                  <div className="mt-2 flex justify-between">
                    <a 
                      href={shop.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View on Yelp
                    </a>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => addToFavorites(shop)}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
        
        <MapBoundsHandler shops={filteredShops} shouldFitBounds={shouldFitBounds} />
      </MapContainer>
      
      {selectedShop && shops.length > 10 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
          <h3 className="font-semibold">{selectedShop.name}</h3>
          <p className="text-sm">{selectedShop.address}, {selectedShop.city}, {selectedShop.state}</p>
          <div className="flex justify-between items-center mt-2">
            <Badge variant="outline">
              {selectedShop.rating} ★ ({selectedShop.review_count} reviews)
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addToFavorites(selectedShop)}
            >
              <Heart className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
