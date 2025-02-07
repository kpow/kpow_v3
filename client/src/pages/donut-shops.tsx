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
import { ShopSlider } from "@/components/shop-slider";
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
}

export default function DonutShops() {
  const [searchType, setSearchType] = useState<string>("city");
  const [searchState, setSearchState] = useState<SearchState>({});
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  const { toast } = useToast();

  const {
    data: allShops = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["donutShops", searchState],
    queryFn: async () => {
      const queryString = new URLSearchParams();

      if (searchType === "city" && searchState.city) {
        queryString.append("location", searchState.city);
      } else if (searchType === "zipcode" && searchState.zipCode) {
        queryString.append("location", searchState.zipCode);
      } else if (
        searchType === "coords" &&
        searchState.latitude &&
        searchState.longitude
      ) {
        queryString.append("latitude", searchState.latitude.toString());
        queryString.append("longitude", searchState.longitude.toString());
      } else {
        return [];
      }

      const response = await fetch(`/api/yelp/search?${queryString}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shops");
      }

      const data = await response.json();
      setShouldFitBounds(true);
      return data;
    },
    enabled: false,
  });

  const shops = allShops.filter((shop) => shop.rating >= minRating);

  const handleSearch = async () => {
    const validationMessage = getValidationMessage();
    if (validationMessage) {
      toast({
        title: "Missing Information",
        description: validationMessage,
        variant: "destructive",
      });
      return;
    }
    await refetch();
  };

  const getValidationMessage = () => {
    if (searchType === "city" && !searchState.city) {
      return "Please enter a city name";
    }
    if (searchType === "zipcode" && !searchState.zipCode) {
      return "Please enter a zip code";
    }
    if (
      searchType === "coords" &&
      (!searchState.latitude || !searchState.longitude)
    ) {
      return "Please enter both latitude and longitude";
    }
    return null;
  };

  const handleInputChange = (
    value: string | number,
    field: keyof SearchState,
  ) => {
    setSearchState((prev) => ({ ...prev, [field]: value }));
  };

  const handleShopClick = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShouldFitBounds(false);
  };

  const handleRatingChange = (value: number[]) => {
    setMinRating(value[0]);
  };

  return (
    <div className="container mx-auto">
      <PageTitle size="lg" className="mb-4">
        donut tour
      </PageTitle>

      <Card className="mb-4">
        <CardContent className="pt-2">
          <div className="h-[400px] w-full rounded-lg">
            <DonutShopMap
              shops={shops}
              onShopClick={handleShopClick}
              shouldFitBounds={shouldFitBounds}
              selectedShopId={selectedShopId}
            />
          </div>
        </CardContent>
      </Card>

      {shops.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Featured Shops</h2>
            <ShopSlider shops={shops} onShopClick={handleShopClick} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">        
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Tabs
              defaultValue="city"
              onValueChange={(value) => {
                setSearchType(value);
                setSearchState({});
              }}
            >
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
                    value={searchState.city || ""}
                    onChange={(e) => handleInputChange(e.target.value, "city")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="zipcode" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="Enter zip code"
                    value={searchState.zipCode || ""}
                    onChange={(e) => handleInputChange(e.target.value, "zipCode")}
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
                      value={searchState.latitude || ""}
                      onChange={(e) =>
                        handleInputChange(parseFloat(e.target.value), "latitude")
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      placeholder="Enter longitude"
                      value={searchState.longitude || ""}
                      onChange={(e) =>
                        handleInputChange(parseFloat(e.target.value), "longitude")
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="mt-6 space-y-4">
                <Label>Minimum Rating</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[minRating]}
                    onValueChange={handleRatingChange}
                    max={5}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="min-w-[4rem] text-sm">{minRating} ⭐</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Search Donut Shops"}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}