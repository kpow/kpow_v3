import { useQuery } from "@tanstack/react-query";
import { getAttendedShows } from "@/lib/phish-api";
import { Card, CardContent } from "@/components/ui/card";
import { ShowCard } from "@/components/show-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const ITEMS_PER_PAGE = 6;

export default function ShowStats() {
  const username = "koolyp";
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/shows/attended", username, page],
    queryFn: () => getAttendedShows(username, page, ITEMS_PER_PAGE)
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-slackey mb-8">Show Statistics</h1>

      {/* Basic Stats Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-lg font-slackey mb-2">Total Shows</h2>
            <div className="text-4xl font-bold">
              {isLoading ? (
                <Skeleton className="h-12 w-24 mx-auto" />
              ) : (
                data?.total || 0
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shows Grid */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.shows.map((show) => (
                  <ShowCard
                    key={show.showid}
                    show={show}
                  />
                ))}
              </div>
              {data && data.total > ITEMS_PER_PAGE && (
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">Page {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * ITEMS_PER_PAGE >= (data?.total || 0)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}