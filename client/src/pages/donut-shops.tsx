import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { DonutShopMap } from "@/components/donut-shop-map";
import { useToast } from "@/hooks/use-toast";

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

interface SearchState {
  city?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: number; // Added timestamp for forcing refetches
}

export default function DonutShops() {
  const [searchType, setSearchType] = useState<string>("city");
  const [searchState, setSearchState] = useState<SearchState>({});
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const { toast } = useToast();

  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: ["donutShops", searchState],
    queryFn: async () => {
      const queryString = new URLSearchParams();

      if (searchType === "city" && searchState.city) {
        queryString.append("location", searchState.city);
      } else if (searchType === "zipcode" && searchState.zipCode) {
        queryString.append("location", searchState.zipCode);
      } else if (searchType === "coords" && searchState.latitude && searchState.longitude) {
        queryString.append("latitude", searchState.latitude.toString());
        queryString.append("longitude", searchState.longitude.toString());
      } else {
        return [];
      }

      console.log('Fetching shops with query:', queryString.toString());
      const response = await fetch(`/api/yelp/search?${queryString}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shops');
      }
      const data = await response.json();
      console.log('Received shops data:', data);
      return data;
    },
    enabled: Object.keys(searchState).length > 0,
    retry: 1,
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch donut shops",
        variant: "destructive",
      });
    }
  });

  const handleSearch = () => {
    if (searchType === "city" && !searchState.city) {
      toast({
        title: "Missing Information",
        description: "Please enter a city name",
        variant: "destructive",
      });
      return;
    }
    if (searchType === "zipcode" && !searchState.zipCode) {
      toast({
        title: "Missing Information",
        description: "Please enter a zip code",
        variant: "destructive",
      });
      return;
    }
    if (searchType === "coords" && (!searchState.latitude || !searchState.longitude)) {
      toast({
        title: "Missing Information",
        description: "Please enter both latitude and longitude",
        variant: "destructive",
      });
      return;
    }

    // Force a refetch by updating the state
    setSearchState(prev => ({ ...prev, timestamp: Date.now() }));
  };

  const handleShopClick = (shop: Shop) => {
    setSelectedShop(shop);
    setMapCenter([shop.coordinates.latitude, shop.coordinates.longitude]);
  };

  return (
    <div className="container mx-auto p-4">
      <PageTitle size="lg" className="mb-8">Donut Shop Finder</PageTitle>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <Tabs defaultValue="city" onValueChange={(value) => {
            setSearchType(value);
            setSearchState({}); // Clear previous search state when changing type
          }}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="city">City Search</TabsTrigger>
              <TabsTrigger value="zipcode">Zip Code</TabsTrigger>
              <TabsTrigger value="coords">Coordinates</TabsTrigger>
            </TabsList>

            <TabsContent value="city" className="space-y-4">
              <div className="grid gap-2">
                <Label>City Name</Label>
                <Input 
                  placeholder="Enter city name"
                  onChange={(e) => setSearchState({ city: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="zipcode" className="space-y-4">
              <div className="grid gap-2">
                <Label>Zip Code</Label>
                <Input 
                  placeholder="Enter zip code"
                  onChange={(e) => setSearchState({ zipCode: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="coords" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Latitude</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter latitude"
                    onChange={(e) => setSearchState(prev => ({ 
                      ...prev, 
                      latitude: parseFloat(e.target.value) 
                    }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter longitude"
                    onChange={(e) => setSearchState(prev => ({ 
                      ...prev, 
                      longitude: parseFloat(e.target.value) 
                    }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button 
              onClick={handleSearch}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search Donut Shops"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-slackey mb-6">Shop Map</h2>
            <div className="h-[600px] w-full rounded-lg">
              <DonutShopMap 
                shops={shops} 
                center={mapCenter}
                onShopClick={handleShopClick}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-slackey mb-6">Shop Details</h2>
            <div className="space-y-4">
              {selectedShop ? (
                <>
                  <h3 className="text-xl font-bold">{selectedShop.name}</h3>
                  <p className="text-sm text-gray-600">{selectedShop.address}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rating:</span>
                    <span>{selectedShop.rating} ⭐</span>
                  </div>
                  {selectedShop.price && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Price:</span>
                      <span>{selectedShop.price}</span>
                    </div>
                  )}
                  {selectedShop.image_url && (
                    <img 
                      src={selectedShop.image_url} 
                      alt={selectedShop.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </>
              ) : (
                <p className="text-gray-500">Select a shop on the map to see details</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}