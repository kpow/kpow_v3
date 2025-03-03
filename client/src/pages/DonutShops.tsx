
import React, { useState, useEffect } from 'react';
import DonutShopMap from '@/components/donut-shop-map';
import { useQuery } from '@tanstack/react-query';
import { PageTitle } from '@/components/ui/page-title';
import { SEO } from '@/components/SEO';

export function DonutShops({ params }: { params?: { city?: string } }) {
  const [shouldFitBounds, setShouldFitBounds] = useState(true);
  
  useEffect(() => {
    if (shouldFitBounds) {
      // Give the map more time to properly set bounds
      // Increased timeout to ensure map has time to load and calculate bounds
      const timer = setTimeout(() => setShouldFitBounds(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds]);
  
  // Force shouldFitBounds to true when shops data changes
  useEffect(() => {
    if (data?.shops && data.shops.length > 0) {
      setShouldFitBounds(true);
    }
  }, [data?.shops]);

  useEffect(() => {
    if (params) {
      console.log("Params in DonutShops:", params);
    }
  }, [params]);

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/yelp/donut-shops${params?.city ? `?city=${params.city}` : ''}`],
    queryFn: async () => {
      console.log(`Fetching donut shops for ${params?.city || 'default location'}...`);
      const response = await fetch(`/api/yelp/donut-shops${params?.city ? `?city=${params.city}` : ''}`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const getPageTitle = () => {
    return `Donut Shops ${params?.city ? `in ${params.city}` : ''}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <SEO title={getPageTitle()} description={`Find the best donut shops ${params?.city ? `in ${params.city}` : 'near you'}`} />
      <PageTitle>{getPageTitle()}</PageTitle>
      <div className="mt-6">
        <DonutShopMap 
          shops={data?.shops || []}
          isLoading={isLoading}
          error={error instanceof Error ? error : null}
          cityCoordinates={data?.cityCoordinates}
          shouldFitBounds={shouldFitBounds}
        />
      </div>
    </div>
  );
}

// Add default export
export default DonutShops;
