import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { DonutShopMap } from "@/components/donuts/donut-shop-map";
import { ShopSlider } from "@/components/donuts/shop-slider";
import { useToast } from "@/hooks/use-toast";
import { cities } from "@/data/cities";
import { Shuffle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/global/SEO";
import { CityTagCloud } from "@/components/donuts/CityTagCloud";
import { DonutLuvList } from "@/components/donuts/donut-luv-list";
import { Shop } from "@/types/shop";
import { DonutShopSearch } from "@/components/donuts/DonutShopSearch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { YelpResponse } from "@/types/shop";

interface SearchState {
  city?: string;
  state?: string;
}

export default function DonutShops() {
  const [, params] = useRoute("/donut-tour/:city/:state");
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const getRandomCity = () => {
    const randomIndex = Math.floor(Math.random() * cities.length);
    return {
      city: cities[randomIndex].city,
      state: cities[randomIndex].state,
    };
  };

  const initialCity = params
    ? {
        city: decodeURIComponent(params.city),
        state: decodeURIComponent(params.state),
      }
    : getRandomCity();

  const [searchState, setSearchState] = useState<SearchState>(initialCity);
  const [selectedShopId, setSelectedShopId] = useState<string | undefined>(undefined);
  const [minRating, setMinRating] = useState(0);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);

  const { data, refetch } = useQuery<YelpResponse>({
    queryKey: ["donutShops", searchState],
    queryFn: async () => {
      if (!searchState.city || !searchState.state) {
        return { shops: [], chainStores: [], cityCenter: null, metrics: null };
      }

      const queryString = new URLSearchParams();
      const location = `${searchState.city}, ${searchState.state}`;
      queryString.append("location", location);

      try {
        const response = await fetch(`/api/yelp/search?${queryString}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch shops");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching shops:", error);
        throw error;
      }
    },
    enabled: false,
    staleTime: Infinity,
  });

  const shops = (data?.shops || []).filter((shop) => shop.rating >= minRating);
  const chainStores = data?.chainStores || [];

  const handleSearchStateChange = (
    field: keyof SearchState,
    value: string,
  ) => {
    setSearchState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!searchState.city || !searchState.state) {
      toast({
        title: "Missing Information",
        description: "Please enter both city and state",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingShops(true);
    setSelectedShopId(undefined);

    setLocation(
      `/donut-tour/${encodeURIComponent(searchState.city)}/${encodeURIComponent(
        searchState.state,
      )}`,
    );

    try {
      await refetch();
      setShouldFitBounds(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch donut shops. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleRandomCity = async () => {
    const newCity = getRandomCity();
    setSearchState(newCity);
    setSelectedShopId(undefined);
    setLocation(
      `/donut-tour/${encodeURIComponent(newCity.city)}/${encodeURIComponent(
        newCity.state,
      )}`,
    );
    await handleSearch();
  };

  const handleShopClick = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShouldFitBounds(false);
  };

  const handleRatingChange = (value: number[]) => {
    setMinRating(value[0]);
  };

  // Effect to handle initial search on mount
  useEffect(() => {
    if (searchState.city && searchState.state) {
      handleSearch();
    }
  }, []);

  // Effect to handle URL parameter changes
  useEffect(() => {
    if (params) {
      const newState = {
        city: decodeURIComponent(params.city),
        state: decodeURIComponent(params.state),
      };
      setSearchState(newState);
      handleSearch();
    }
  }, [params?.city, params?.state]);

  // Reset fit bounds after a delay when data changes
  useEffect(() => {
    if (shouldFitBounds) {
      const timer = setTimeout(() => setShouldFitBounds(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds]);

  const handleFavoriteShopSelect = (
    city: string,
    state: string,
    shopId?: string,
  ) => {
    setSearchState({ city, state });
    if (shopId) {
      setSelectedShopId(shopId);
    }
    handleSearch();
  };

  return (
    <>
      <SEO
        title={`Donut Shops in ${searchState.city || ''}, ${searchState.state || ''}`}
        description={`Find local donut shops in ${searchState.city || ''}, ${searchState.state || ''}`}
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
            className="w-full sm:w-auto sm:ml-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Random City
          </Button>
        </div>

        <div className="mb-4">
          {isLoadingShops ? (
            <Skeleton className="h-[200px] w-full" />
          ) : shops && shops.length > 0 ? (
            <ShopSlider shops={shops} onShopClick={handleShopClick} />
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 lg:row-span-2">
            <Card>
              <CardContent className="p-0 h-full min-w-[300px] sm:min-w-[400px] lg:min-w-[800px] xl:min-w-[780px] lg:min-h-[600px] sm:min-h-[400px] min-h-[350px]">
                <DonutShopMap
                  shops={shops}
                  chainStores={chainStores}
                  onShopClick={handleShopClick}
                  shouldFitBounds={shouldFitBounds}
                  selectedShopId={selectedShopId}
                  cityCenter={data?.cityCenter || null}
                  isLoading={isLoadingShops}
                />
              </CardContent>
            </Card>
          </div>

          <DonutShopSearch
            searchState={searchState}
            onSearchStateChange={handleSearchStateChange}
            minRating={minRating}
            onMinRatingChange={handleRatingChange}
            onSearch={handleSearch}
            isLoading={isLoadingShops}
            metricsData={data?.metrics}
          />
        </div>

        <div className="flex flex-col w-full items-center justify-center mt-4">
          <Card className="mt-0 w-full">
            <CardContent className="p-4">
              <div className="space-y-4">
                <Collapsible className="w-full">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-slackey">donut luv</h2>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <DonutLuvList onCitySelect={handleFavoriteShopSelect} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible className="w-full">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-slackey">recent tours</h2>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <CityTagCloud
                      onCitySelect={(city, state) => {
                        setSearchState({ city, state });
                        handleSearch();
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
      </div>
    </>
  );
}