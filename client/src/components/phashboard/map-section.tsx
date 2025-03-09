import { Card, CardContent } from "@/components/ui/card";
import { VenueMap } from "@/components/phashboard/venue-map";

export function MapSection() {
  return (
    <Card className="h-full">
      <CardContent className="p-0 m-0">
        <VenueMap />
      </CardContent>
    </Card>
  );
}
