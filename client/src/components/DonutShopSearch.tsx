import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
        </div>
      </CardContent>
    </Card>
  );
}