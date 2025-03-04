import { Card } from "@/components/ui/card";
import { useEffect } from "react";

interface SearchMetrics {
  donutResults: number;
  doughnutResults: number;
  totalUniqueShops: number;
  filteredShops: number;
  nearbyShops: number;
  chainStoresFiltered: number;
}

interface SearchMetricsProps {
  metrics?: SearchMetrics;
  isLoading?: boolean;
}

const MetricCard = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center justify-center p-2 text-center">
    <span className="font-slackey text-3xl font-bold text-blue-600">
      {value}
    </span>
    <span className="text-sm text-muted-foreground mt-1">{label}</span>
  </div>
);

export function SearchMetrics({ metrics, isLoading }: SearchMetricsProps) {
  useEffect(() => {
    console.log("Received metrics in component:", metrics);
  }, [metrics]);

  if (!metrics) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-2">search metrics</h3>
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Donut Shops" value={metrics.donutResults} />
        <MetricCard label="Doughnut Shops" value={metrics.doughnutResults} />
        <MetricCard label="Unique Shops" value={metrics.totalUniqueShops} />
        <MetricCard label="Nearby Shops" value={metrics.nearbyShops} />
        <MetricCard
          label="Chain Stores Filtered"
          value={metrics.chainStoresFiltered}
        />
      </div>
    </div>
  );
}
