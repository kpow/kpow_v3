import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { phishNetApi } from "@/lib/phishnet-api";

// Components will be split into separate files once structure is confirmed
function ShowsSection() {
  return (
    <div className="bg-black/5 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Shows</h2>
      <div className="space-y-4">
        {/* Show list will go here */}
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-2 border-b border-black/10">
              <div className="h-4 bg-black/10 rounded w-3/4"></div>
              <div className="h-3 bg-black/10 rounded w-1/2 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RunStatistics() {
  return (
    <div className="bg-black/5 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Run Statistics</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-2xl font-bold">--</div>
          <div className="text-sm text-black/60">Total Shows</div>
        </div>
        <div>
          <div className="text-2xl font-bold">--</div>
          <div className="text-sm text-black/60">Unique Venues</div>
        </div>
      </div>
      <div className="space-y-2">
        {/* Venue stats will go here */}
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="h-4 bg-black/10 rounded w-1/2"></div>
              <div className="h-4 bg-black/10 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SongStatistics() {
  return (
    <div className="bg-black/5 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Song Statistics</h2>
      <div className="h-64 bg-black/5 rounded mb-6">
        {/* Chart will go here */}
      </div>
      <div className="space-y-2">
        {/* Song stats will go here */}
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="h-4 bg-black/10 rounded w-1/2"></div>
              <div className="h-4 bg-black/10 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PhishStats() {
  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['/api/phish/shows', 'koolyp'],
    queryFn: () => phishNetApi.getUserShows('koolyp')
  });

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Phish Stats Hub</h1>
        <p className="text-black/60 mb-8">
          Explore statistics and data from Phish concerts and performances.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <ShowsSection />
          </div>
          <div className="space-y-8">
            <RunStatistics />
            <SongStatistics />
          </div>
        </div>
      </div>
    </div>
  );
}