import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { DonutShopMap } from "@/components/donut-shop-map";

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
}

export default function DonutShops() {
  const [searchType, setSearchType] = useState<string>("city");
  const [searchParams, setSearchParams] = useState<SearchState>({});
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["donutShops", searchParams],
    queryFn: async () => {
      const queryString = new URLSearchParams();

      if (searchType === "city" && searchParams.city) {
        queryString.append("city", searchParams.city);
      } else if (searchType === "zipcode" && searchParams.zipCode) {
        queryString.append("zipcode", searchParams.zipCode);
      } else if (searchType === "coords" && searchParams.latitude && searchParams.longitude) {
        queryString.append("latitude", searchParams.latitude.toString());
        queryString.append("longitude", searchParams.longitude.toString());
      }

      const response = await fetch(`/api/donut-shops?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch shops");
      return response.json();
    },
    enabled: Object.keys(searchParams).length > 0
  });

  const handleSearch = () => {
    // Trigger the query by updating search params
    setSearchParams({ ...searchParams });
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
          <Tabs defaultValue="city" onValueChange={setSearchType}>
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
                  onChange={(e) => setSearchParams({ city: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="zipcode" className="space-y-4">
              <div className="grid gap-2">
                <Label>Zip Code</Label>
                <Input 
                  placeholder="Enter zip code"
                  onChange={(e) => setSearchParams({ zipCode: e.target.value })}
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
                    onChange={(e) => setSearchParams(prev => ({ 
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
                    onChange={(e) => setSearchParams(prev => ({ 
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