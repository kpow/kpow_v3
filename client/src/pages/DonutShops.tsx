import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
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
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { CityTagCloud } from "@/components/CityTagCloud";
import { DonutLuvList } from "@/components/donut-luv-list";
import { Shop } from "@/types/shop";
import { SearchMetrics } from "@/components/search-metrics";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function DonutShops() {
  const [searchType, setSearchType] = useState<string>("city");
  const [, params] = useRoute("/donut-tour/:city/:state");

  const initialCity = params
    ? {
        city: decodeURIComponent(params.city),
        state: decodeURIComponent(params.state),
      }
    : getRandomCity();

  const [searchState, setSearchState] = useState<SearchState>({
    city: initialCity.city,
    state: initialCity.state,
  });
  const [selectedShopId, setSelectedShopId] = useState<string | undefined>(
    undefined,
  );
  const [minRating, setMinRating] = useState(0);
  const [shouldFitBounds, setShouldFitBounds] = useState(true);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
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
        return { shops: [], metrics: null };
      }

      const response = await fetch(`/api/yelp/search?${queryString}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shops");
      }

      const data = await response.json();
      console.log("Received API response:", data);

      if (
        data.shops.length > 0 &&
        searchType === "city" &&
        searchState.city &&
        searchState.state
      ) {
        saveToVisitedCities(searchState.city, searchState.state);
      }

      setShouldFitBounds(true);
      return data;
    },
    enabled: false,
    staleTime: Infinity,
  });

  const shops = (data?.shops || []).filter(
    (shop: Shop) => shop.rating >= minRating,
  );

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

    if (searchState.city && searchState.state) {
      setLocation(
        `/donut-tour/${encodeURIComponent(searchState.city)}/${encodeURIComponent(searchState.state)}`,
      );
    }

    await refetch();
  };

  const [, setLocation] = useLocation();

  const handleRandomCity = async () => {
    try {
      const newCity = getRandomCity();
      setSearchState({
        city: newCity.city,
        state: newCity.state,
      });
      setShouldFitBounds(true);
      setLocation(
        `/donut-tour/${encodeURIComponent(newCity.city)}/${encodeURIComponent(newCity.state)}`,
      );
      await refetch();
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

  const getPageTitle = () => {
    if (searchType === "city" && searchState.city && searchState.state) {
      return `Donut Shops in ${searchState.city}, ${searchState.state}`;
    }
    if (searchType === "zipcode" && searchState.zipCode) {
      return `Donut Shops near ${searchState.zipCode}`;
    }
    return "Find Local Donut Shops";
  };

  const getPageDescription = () => {
    const shopCount = shops.length;
    const locationText =
      searchState.city && searchState.state
        ? `${searchState.city}, ${searchState.state}`
        : searchState.zipCode
          ? `ZIP code ${searchState.zipCode}`
          : "your area";

    return `Discover ${shopCount} delicious donut shops in ${locationText}. Find ratings, reviews, and locations of the best donut shops near you.`;
  };

  const getPreviewImage = () => {
    return shops[0]?.image_url ?? "/donut-placeholder.png";
  };

  useEffect(() => {
    if (shouldFitBounds) {
      const timer = setTimeout(() => setShouldFitBounds(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds]);

  useEffect(() => {
    if (params) {
      setSearchState({
        city: decodeURIComponent(params.city),
        state: decodeURIComponent(params.state),
      });
      setShouldFitBounds(true);
      refetch();
    }
  }, [params?.city, params?.state]);

  const handleFavoriteShopSelect = (
    city: string,
    state: string,
    shopId?: string,
  ) => {
    setSearchState({ city, state });
    setSearchType("city");
    if (shopId) {
      setSelectedShopId(shopId);
    }
    setShouldFitBounds(true);
    setTimeout(() => {
      refetch().then(() => {
        if (shopId) {
          setSelectedShopId(shopId);
          setShouldFitBounds(false);
        }
      });
    }, 0);
  };

  useEffect(() => {
    const handleFetchComplete = () => {
      setIsLoadingShops(false);
    };

    if (data?.shops && data.shops.length > 0) {
      handleFetchComplete();
    }

    return () => {};
  }, [data?.shops]);

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
        image={getPreviewImage()}
        type="website"
      />
      <div className="container mx-auto max-w-[1800px] flex flex-col min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
          <PageTitle size="lg" className="text-2xl sm:text-3xl break-words">
            donut tour{" "}
            {searchState.city && searchState.state
              ? `- ${searchState.city}, ${searchState.state}`
              : ""}
          </PageTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandomCity}
            className="w-full sm:w-auto sm:ml-4 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Random City
          </Button>
        </div>

        <div className="mb-4">
          <div className="h-full w-full rounded-lg overflow-hidden">
            {isLoadingShops ? (
              <div className="w-full">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : shops && shops.length > 0 ? (
              <div className="h-full w-full rounded-lg overflow-hidden">
                <ShopSlider shops={shops} onShopClick={handleShopClick} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:max-w-[1800px] mx-auto flex flex-col items-stretch">
          <div className="lg:col-span-2 lg:row-span-2 h-full flex flex-col">
            <Card>
              <CardContent className="p-0 h-full min-w-[300px] sm:min-w-[400px] lg:min-w-[800px] xl:min-w-[780px] lg:min-h-[600px] sm:min-h-[400px] min-h-[350px]">
                {shops &&
                  shops.length > 0 &&
                  shops.some(
                    (shop: Shop) =>
                      shop.coordinates?.latitude && shop.coordinates?.longitude,
                  ) && (
                    <DonutShopMap
                      shops={shops}
                      onShopClick={handleShopClick}
                      shouldFitBounds={shouldFitBounds}
                      selectedShopId={selectedShopId}
                    />
                  )}
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <Collapsible className="w-full min-w-[300px] sm:min-w-[400px] lg:min-w-[800px] xl:min-w-[1000px]">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h2 className="text-lg font-slackey">donut luv</h2>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 transition-all duration-300">
                      <DonutLuvList onCitySelect={handleFavoriteShopSelect} />
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible className="w-full">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h2 className="text-lg font-slackey">recent tours</h2>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 transition-all duration-300">
                      <CityTagCloud
                        onCitySelect={(city, state) => {
                          setSearchState({ city, state });
                          setTimeout(() => {
                            refetch();
                          }, 0);
                        }}
                        selectedCity={
                          searchState.city && searchState.state
                            ? {
                                city: searchState.city,
                                state: searchState.state,
                              }
                            : undefined
                        }
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-1 h-full">
            <CardContent className="pt-4 h-full flex flex-col">
              <div className="mb-4">
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

              <div className="flex-1 flex flex-col">
                <Tabs
                  defaultValue="city"
                  onValueChange={(value) => {
                    setSearchType(value);
                    setSearchState({});
                  }}
                  className="flex flex-col h-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="city">City Search</TabsTrigger>
                    <TabsTrigger value="zipcode">Zip Code</TabsTrigger>
                    <TabsTrigger value="coords">Coordinates</TabsTrigger>
                  </TabsList>

                  <div className="flex-1 flex flex-col">
                    <TabsContent value="city" className="grid gap-4">
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
                    </TabsContent>

                    <TabsContent value="zipcode">
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

                    <TabsContent value="coords">
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
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={handleSearch}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
                      disabled={isLoading}
                    >
                      {isLoading ? "Searching..." : "Search Donut Shops"}
                    </Button>

                    <div className="mt-4">
                      <SearchMetrics
                        metrics={data?.metrics}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

const getRandomCity = () => {
  const randomIndex = Math.floor(Math.random() * cities.length);
  return {
    city: cities[randomIndex].city,
    state: cities[randomIndex].state,
  };
};

const saveToVisitedCities = (city: string, state: string) => {
  const newCity = {
    city,
    state,
    timestamp: Date.now(),
  };

  const storedCities = localStorage.getItem("visitedCities");
  const currentCities = storedCities ? JSON.parse(storedCities) : [];

  const exists = currentCities.some(
    (prevCity: any) => prevCity.city === city && prevCity.state === state,
  );

  if (!exists) {
    const updated = [newCity, ...currentCities];
    const trimmed = updated.slice(0, 55);
    localStorage.setItem("visitedCities", JSON.stringify(trimmed));
    window.dispatchEvent(new Event("visitedCitiesUpdated"));
  }
};

interface SearchState {
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}
