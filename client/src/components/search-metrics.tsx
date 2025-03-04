import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
  <div className="flex flex-col items-center justify-center p-1 text-center">
    <span className="text-2xl font-bold text-blue-600">{value}</span>
    <span className="text-sm text-muted-foreground mt-1">{label}</span>
  </div>
);

const MetricSkeleton = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center p-2 text-center">
    <Skeleton className="h-10 w-12 mb-1" />
    <span className="text-sm text-muted-foreground mt-1">{label}</span>
  </div>
);

export function SearchMetrics({ metrics, isLoading }: SearchMetricsProps) {
  useEffect(() => {
    console.log("Received metrics in component:", metrics);
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">search metrics</h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricSkeleton label="Donut Shops" />
          <MetricSkeleton label="Doughnut Shops" />
          <MetricSkeleton label="Unique Shops" />
          <MetricSkeleton label="Nearby Shops" />
          <MetricSkeleton label="Chain Stores Filtered" />
        </div>
      </div>
    );
  }

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
