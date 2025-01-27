import { useQuery } from "@tanstack/react-query";
import { phishNetApi, type Show } from "@/lib/phishnet-api";

function ShowList({ shows = [] }: { shows: Show[] }) {
  return (
    <section className="bg-white p-8 rounded shadow">
      <h2 className="text-xl font-semibold mb-6">Shows</h2>
      <div className="space-y-4">
        {shows.map((show) => (
          <div 
            key={show.showid} 
            className="flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">{show.showdate}</div>
              <div className="text-sm text-gray-500">{show.location}</div>
            </div>
            <button className="text-sm text-blue-500">→</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Page 1 of 7</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded border">Previous</button>
          <button className="px-3 py-1 rounded border">Next</button>
        </div>
      </div>
    </section>
  );
}

function StatisticsPanel({ shows = [] }: { shows: Show[] }) {
  const uniqueVenues = new Set(shows.map(show => show.venue)).size;

  return (
    <section className="bg-white p-8 rounded shadow">
      <h2 className="text-xl font-semibold mb-6">Run Statistics</h2>
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-3xl font-bold">{shows.length}</div>
          <div className="text-sm text-gray-500">Total Shows</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{uniqueVenues}</div>
          <div className="text-sm text-gray-500">Unique Venues</div>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(shows.reduce((acc, show) => {
          acc[show.venue] = (acc[show.venue] || 0) + 1;
          return acc;
        }, {} as Record<string, number>))
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([venue, count]) => (
            <div key={venue} className="flex justify-between items-center">
              <span className="text-sm">{venue}</span>
              <span className="text-sm font-medium">{count}</span>
            </div>
          ))
        }
      </div>
    </section>
  );
}

function SongStatistics() {
  // This will be implemented in the next phase with the chart
  return (
    <section className="bg-white p-8 rounded shadow">
      <h2 className="text-xl font-semibold mb-6">Song Statistics</h2>
      <div className="h-64 bg-gray-100 rounded mb-6" />
      <div className="space-y-2">
        {/* Placeholder song data */}
        {[
          ["Tweezer", 25],
          ["Tweezer Reprise", 21],
          ["Ghost", 28],
          ["Chalk Dust Torture", 28],
          ["Down with Disease", 19]
        ].map(([song, count]) => (
          <div key={song} className="flex justify-between items-center">
            <span className="text-sm">{song}</span>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PhishStats() {
  const { data: shows = [], isLoading, error } = useQuery({
    queryKey: ["/api/phish/shows", "koolyp"],
    queryFn: () => phishNetApi.getUserShows("koolyp")
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="bg-black text-white py-4 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">kpow phishboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ShowList shows={shows} />
          </div>
          <div className="space-y-8">
            <StatisticsPanel shows={shows} />
            <SongStatistics />
          </div>
        </div>
      </main>
    </div>
  );
}