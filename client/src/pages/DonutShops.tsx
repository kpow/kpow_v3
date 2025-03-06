import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
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
import { DonutShopSearch } from "@/components/DonutShopSearch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { YelpResponse } from "@/types/shop";

/**
 * Interface representing the state of the search criteria
 */
interface SearchState {
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * DonutShops - Main component for the donut shop discovery page
 * This page allows users to search for donut shops by city, zip code,
 * or coordinates and displays results on a map and in a slider.
 */
export default function DonutShops() {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const [searchType, setSearchType] = useState<string>("city");
  const [, params] = useRoute("/donut-tour/:city/:state");

  /**
   * Returns a random city from the predefined cities list
   */
  const getRandomCity = () => {
    const randomIndex = Math.floor(Math.random() * cities.length);
    return {
      city: cities[randomIndex].city,
      state: cities[randomIndex].state,
    };
  };

  // Initialize with a city from URL params or random city
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
  const [, setLocation] = useLocation();

  // =========================================================================
  // DATA FETCHING WITH REACT QUERY
  // =========================================================================

  /**
   * Query for fetching donut shop data based on search criteria
   */
  const { data, isLoading, refetch } = useQuery<YelpResponse>({
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
        return { shops: [], chainStores: [], cityCenter: null, metrics: null };
      }

      const response = await fetch(`/api/yelp/search?${queryString}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shops");
      }

      return response.json();
    },
    enabled: false, // Don't run automatically on mount
    staleTime: Infinity, // Don't refetch automatically
  });

  // Filter shops based on minimum rating
  const shops = (data?.shops || []).filter((shop) => shop.rating >= minRating);

  const chainStores = data?.chainStores || [];

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Validates search criteria and initiates search
   */
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

    // Update URL if searching by city
    if (searchState.city && searchState.state) {
      setLocation(
        `/donut-tour/${encodeURIComponent(searchState.city)}/${encodeURIComponent(
          searchState.state,
        )}`,
      );
    }

    await refetch();
  };

  /**
   * Selects a random city and initiates search
   */
  const handleRandomCity = async () => {
    try {
      const newCity = getRandomCity();
      setSearchState({
        city: newCity.city,
        state: newCity.state,
      });
      setShouldFitBounds(true);
      setLocation(
        `/donut-tour/${encodeURIComponent(newCity.city)}/${encodeURIComponent(
          newCity.state,
        )}`,
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

  /**
   * Validates search criteria based on search type
   * @returns Error message or null if valid
   */
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

  /**
   * Updates search state when inputs change
   */
  const handleInputChange = (
    value: string | number,
    field: keyof SearchState,
  ) => {
    setSearchState((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handles shop selection on map or slider
   */
  const handleShopClick = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShouldFitBounds(false);
  };

  /**
   * Updates minimum rating filter
   */
  const handleRatingChange = (value: number[]) => {
    setMinRating(value[0]);
  };

  /**
   * Handles selection of a favorite shop from the donut luv list
   */
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

  // =========================================================================
  // SIDE EFFECTS
  // =========================================================================

  // Reset map bounds after a delay
  useEffect(() => {
    if (shouldFitBounds) {
      const timer = setTimeout(() => setShouldFitBounds(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds]);

  // Fit map bounds when shops data changes
  useEffect(() => {
    if (data?.shops && data.shops.length > 0) {
      setShouldFitBounds(true);
    }
  }, [data?.shops]);

  // Handle URL parameter changes
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

  // Update loading state when data is fetched
  useEffect(() => {
    if (data?.shops && data.shops.length > 0) {
      setIsLoadingShops(false);
    }
  }, [data?.shops]);

  // =========================================================================
  // HELPER FUNCTIONS FOR SEO AND DISPLAY
  // =========================================================================

  /**
   * Generates page title based on search criteria
   */
  const getPageTitle = () => {
    if (searchType === "city" && searchState.city && searchState.state) {
      return `Donut Shops in ${searchState.city}, ${searchState.state}`;
    }
    if (searchType === "zipcode" && searchState.zipCode) {
      return `Donut Shops near ${searchState.zipCode}`;
    }
    return "Find Local Donut Shops";
  };

  /**
   * Generates page description for SEO
   */
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

  /**
   * Gets preview image for social sharing
   */
  const getPreviewImage = () => {
    return shops[0]?.image_url ?? "/donut-placeholder.png";
  };

  // =========================================================================
  // RENDER COMPONENT
  // =========================================================================
  return (
    <>
      {/* SEO Metadata */}
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
        image={getPreviewImage()}
        type="website"
      />

      <div className="container mx-auto max-w-[1800px] flex flex-col min-h-screen">
        {/* Page Header */}
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

        {/* Shop Slider */}
        <div className="mb-4">
          <div className="h-full w-full rounded-lg overflow-hidden">
            <div className="h-full w-full rounded-lg overflow-hidden">
              {shops && shops.length > 0 ? (
                <ShopSlider 
                  shops={shops} 
                  onShopClick={handleShopClick} 
                  isLoading={isLoadingShops} 
                />
              ) : isLoadingShops ? (
                <ShopSlider 
                  shops={[]} 
                  onShopClick={() => {}} 
                  isLoading={true} 
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:max-w-[1800px] mx-auto flex flex-col items-stretch">
          {/* Left Content Area (Map and Collections) */}
          <div className="lg:col-span-2 lg:row-span-2 h-full flex flex-col">
            {/* Map Component */}
            <Card>
              <CardContent className="p-0 h-full min-w-[300px] sm:min-w-[400px] lg:min-w-[800px] xl:min-w-[780px] lg:min-h-[600px] sm:min-h-[400px] min-h-[350px]">
                {shops && shops.length > 0 && (
                  <DonutShopMap
                    shops={shops}
                    chainStores={chainStores}
                    onShopClick={handleShopClick}
                    shouldFitBounds={shouldFitBounds}
                    selectedShopId={selectedShopId}
                    cityCenter={data?.cityCenter || null}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Search Component */}
          <DonutShopSearch
            searchState={searchState}
            onSearchStateChange={handleInputChange}
            minRating={minRating}
            onMinRatingChange={handleRatingChange}
            onSearch={handleSearch}
            isLoading={isLoading}
            metricsData={data?.metrics}
          />
        </div>

        {/* Collapsible Sections */}
        <div className="flex flex-col w-full items-center justify-center mt-4">
          <Card className="mt-0 w-full">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Donut Luv Section */}
                <Collapsible className="w-full">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-slackey">donut luv</h2>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 transition-all duration-300">
                    <DonutLuvList onCitySelect={handleFavoriteShopSelect} />
                  </CollapsibleContent>
                </Collapsible>

                {/* Recent Tours Section */}
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
      </div>
    </>
  );
}
