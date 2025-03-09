import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollList, ScrollListItem } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface VenuesListProps {
  venues: Array<{ venue: string; count: number }> | undefined;
  loading: boolean;
  onVenueSelect: (venue: string) => void;
}

export function VenuesList({ venues, loading, onVenueSelect }: VenuesListProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-slackey mb-4">venues</h2>
        <ScrollArea maxHeight="450px">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                >
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : venues && venues.length > 0 ? (
            <ScrollList>
              {venues.map((venue) => (
                <ScrollListItem
                  key={venue.venue}
                  onClick={() => onVenueSelect(venue.venue)}
                >
                  <span className="font-medium">{venue.venue}</span>
                  <span className="text-muted-foreground">
                    {venue.count} shows
                  </span>
                </ScrollListItem>
              ))}
            </ScrollList>
          ) : (
            <div className="p-3 text-center">No venues found</div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
