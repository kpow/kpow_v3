import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
  minRating?: number;
}

export default function DonutShops() {
  const [searchType, setSearchType] = useState<string>("city");
  const [searchState, setSearchState] = useState<SearchState>({
    minRating: 0
  });
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const { toast } = useToast();

  const { data: allShops = [], isLoading, refetch } = useQuery({
    queryKey: ["donutShops", searchState],
    queryFn: async () => {
      console.log("Search state:", searchState);
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
    enabled: false // Don't run query automatically
  });

  // Filter shops based on minimum rating
  const shops = allShops.filter(shop => 
    !searchState.minRating || shop.rating >= searchState.minRating
  );

  const handleSearch = async () => {
    // Validate search input
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

    console.log("Triggering search with state:", searchState);
    await refetch(); // Manually trigger the query
  };

  const handleInputChange = (value: string | number, field: keyof SearchState) => {
    console.log(`Updating ${field} with value:`, value);
    setSearchState(prev => ({ ...prev, [field]: value }));
  };

  const handleShopClick = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleRatingChange = (value: number[]) => {
    handleInputChange(value[0], 'minRating');
  };

  return (
    <div className="container mx-auto p-4">
      <PageTitle size="lg" className="mb-8">Donut Shop Finder</PageTitle>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <Tabs defaultValue="city" onValueChange={(value) => {
            setSearchType(value);
            setSearchState(prev => ({ 
              minRating: prev.minRating // Preserve rating filter
            })); // Clear previous search state when changing type
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
                  value={searchState.city || ''}
                  onChange={(e) => handleInputChange(e.target.value, 'city')}
                />
              </div>
            </TabsContent>

            <TabsContent value="zipcode" className="space-y-4">
              <div className="grid gap-2">
                <Label>Zip Code</Label>
                <Input 
                  placeholder="Enter zip code"
                  value={searchState.zipCode || ''}
                  onChange={(e) => handleInputChange(e.target.value, 'zipCode')}
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
                    value={searchState.latitude || ''}
                    onChange={(e) => handleInputChange(parseFloat(e.target.value), 'latitude')}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter longitude"
                    value={searchState.longitude || ''}
                    onChange={(e) => handleInputChange(parseFloat(e.target.value), 'longitude')}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Rating Filter */}
            <div className="mt-6 space-y-4">
              <Label>Minimum Rating</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[searchState.minRating || 0]}
                  onValueChange={handleRatingChange}
                  max={5}
                  step={0.5}
                  className="flex-1"
                />
                <span className="min-w-[4rem] text-sm">
                  {searchState.minRating || 0} ⭐
                </span>
              </div>
            </div>
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