
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchMetrics } from "@/components/search-metrics";
import { YelpResponse } from "@/types/shop";

interface SearchState {
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

interface DonutShopSearchProps {
  searchState: SearchState;
  onSearchStateChange: (field: keyof SearchState, value: string | number) => void;
  minRating: number;
  onMinRatingChange: (value: number[]) => void;
  onSearch: () => void;
  isLoading: boolean;
  metricsData?: YelpResponse["metrics"];
}

export function DonutShopSearch({
  searchState,
  onSearchStateChange,
  minRating,
  onMinRatingChange,
  onSearch,
  isLoading,
  metricsData,
}: DonutShopSearchProps) {
  const [searchType, setSearchType] = useState<string>("city");

  const handleInputChange = (
    value: string | number,
    field: keyof SearchState,
  ) => {
    onSearchStateChange(field, value);
  };

  const handleRatingChange = (value: number[]) => {
    onMinRatingChange(value);
  };

  return (
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
              // Reset search state when changing search type
              onSearchStateChange("city", "");
              onSearchStateChange("state", "");
              onSearchStateChange("zipCode", "");
              onSearchStateChange("latitude", 0);
              onSearchStateChange("longitude", 0);
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
                onClick={onSearch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search Donut Shops"}
              </Button>

              <div className="mt-4">
                <SearchMetrics
                  metrics={metricsData}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
