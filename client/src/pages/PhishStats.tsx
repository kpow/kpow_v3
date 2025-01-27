import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { phishNetApi, type Show } from "@/lib/phishnet-api";

function ShowsSection({ shows = [] }: { shows: Show[] }) {
  return (
    <div className="bg-black/5 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Shows</h2>
      <div className="space-y-4">
        {shows.length > 0 ? (
          shows.map((show) => (
            <div key={show.showid} className="py-2 border-b border-black/10">
              <div className="font-medium">{show.venue}</div>
              <div className="text-sm text-black/60 mt-1">
                {new Date(show.showdate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                {show.location && ` • ${show.location}`}
              </div>
            </div>
          ))
        ) : (
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-2 border-b border-black/10">
                <div className="h-4 bg-black/10 rounded w-3/4"></div>
                <div className="h-3 bg-black/10 rounded w-1/2 mt-2"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RunStatistics({ shows = [] }: { shows: Show[] }) {
  const uniqueVenues = new Set(shows.map(show => show.venue)).size;
  const venueStats = shows.reduce((acc, show) => {
    acc[show.venue] = (acc[show.venue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedVenues = Object.entries(venueStats)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="bg-black/5 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Run Statistics</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-2xl font-bold">{shows.length}</div>
          <div className="text-sm text-black/60">Total Shows</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{uniqueVenues}</div>
          <div className="text-sm text-black/60">Unique Venues</div>
        </div>
      </div>
      <div className="space-y-2">
        {sortedVenues.length > 0 ? (
          sortedVenues.map(([venue, count]) => (
            <div key={venue} className="flex items-center justify-between py-1">
              <span className="text-sm truncate">{venue}</span>
              <span className="text-sm font-medium">{count}</span>
            </div>
          ))
        ) : (
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="h-4 bg-black/10 rounded w-1/2"></div>
                <div className="h-4 bg-black/10 rounded w-8"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SongStatistics() {
  return (
    <div className="bg-black/5 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Song Statistics</h2>
      <div className="h-64 bg-black/5 rounded mb-6">
        {/* Chart will be implemented in next iteration */}
      </div>
      <div className="space-y-2">
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
  const { data: shows = [], isLoading, error } = useQuery({
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
            <ShowsSection shows={shows} />
          </div>
          <div className="space-y-8">
            <RunStatistics shows={shows} />
            <SongStatistics />
          </div>
        </div>
      </div>
    </div>
  );
}