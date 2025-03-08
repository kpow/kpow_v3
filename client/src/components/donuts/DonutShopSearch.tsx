import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SearchMetrics } from "@/components/donuts/search-metrics";
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
           <h3 className="text-lg font-medium mb-0">minimum rating</h3>
          <div className="flex items-center gap-4">
            <Slider
              value={[minRating]}
              onValueChange={handleRatingChange}
              max={5}
              step={0.1}
              className="flex-1 mt-0"
            />
            <span className="min-w-[4rem] mt-0 text-lg text-bold">{minRating} ⭐</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="font-medium mb-0">city name</h3>
              <Input
                placeholder="Enter city name"
                value={searchState.city || ""}
                onChange={(e) =>
                  handleInputChange(e.target.value, "city")
                }
              />
            </div>
            <div className="grid gap-2">
               <h3 className="font-medium mb-0">state</h3>
              <Input
                placeholder="Enter state (e.g., CA)"
                value={searchState.state || ""}
                onChange={(e) =>
                  handleInputChange(e.target.value, "state")
                }
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={onSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "search donut shops"}
            </Button>

            <div className="mt-4">
              <SearchMetrics
                metrics={metricsData}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      
      </CardContent>
    </Card>
  );
}