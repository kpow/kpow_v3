import { useState, useEffect } from "react";
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
import { cities } from "@/data/cities";
import { Shuffle } from "lucide-react";

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
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

const getRandomCity = () => {
  const randomIndex = Math.floor(Math.random() * cities.length);
  return {
    city: cities[randomIndex].city,
    state: cities[randomIndex].state,
  };
};

export default function DonutShops() {
  const [searchType, setSearchType] = useState<string>("city");
  const initialCity = getRandomCity();
  const [searchState, setSearchState] = useState<SearchState>({
    city: initialCity.city,
    state: initialCity.state,
  });
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
        const location = `${searchState.city}, ${searchState.state}`;
        queryString.append("location", location);
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

  useEffect(() => {
    // Only trigger search when refetch is available
    if (refetch) {
      refetch();
    }
  }, [refetch]); // Dependency on refetch ensures it's available

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

  const handleRandomCity = () => {
    try {
      const newCity = getRandomCity();
      setSearchState({
        city: newCity.city,
        state: newCity.state,
      });
      // Add a small delay to ensure React state updates complete
      // before triggering the search - this prevents race conditions
      setTimeout(() => {
        handleSearch();
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select a random city. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getValidationMessage = () => {
    if (searchType === "city" && (!searchState.city || !searchState.state)) {
      return "Please enter both city and state";
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
      <div className="flex justify-between items-center mb-4">
        <PageTitle size="lg">
          donut tour{" "}
          {searchState.city && searchState.state
            ? `- ${searchState.city}, ${searchState.state}`
            : ""}
        </PageTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomCity}
          className="ml-4 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Random City
        </Button>
      </div>

      <Card className="mb-4">
        {shops.length > 0 && (
          <div className="h-full w-full rounded-lg overflow-hidden">
            <ShopSlider shops={shops} onShopClick={handleShopClick} />
          </div>
        )}
        <CardContent className="pt-2" />
      </Card>
      <Card className="lg:col-span-2 order-1 lg:order-2">
        <CardContent className="pt-2">
          <div className="h-[500px] w-full rounded-lg">
            <DonutShopMap
              shops={shops}
              onShopClick={handleShopClick}
              shouldFitBounds={shouldFitBounds}
              selectedShopId={selectedShopId}
            />
          </div>
        </CardContent>
        <div className="m-4 mt-0 flex flex-col justify-center">
          <Label className="mb-2">Minimum Rating</Label>
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardContent className="pt-4">
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
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>City Name</Label>
                    <Input
                      placeholder="Enter city name"
                      value={searchState.city || ""}
                      onChange={(e) =>
                        handleInputChange(e.target.value, "city")
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>State</Label>
                    <Input
                      placeholder="Enter state (e.g., CA)"
                      value={searchState.state || ""}
                      onChange={(e) =>
                        handleInputChange(e.target.value, "state")
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="zipcode" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="Enter zip code"
                    value={searchState.zipCode || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, "zipCode")
                    }
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
                        handleInputChange(
                          parseFloat(e.target.value),
                          "latitude",
                        )
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
                        handleInputChange(
                          parseFloat(e.target.value),
                          "longitude",
                        )
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="mt-6">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
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
