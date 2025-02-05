import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import L from 'leaflet';

// Fix for the default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface VenueMapProps {
  venues: Array<{
    venue: string;
    count: number;
    latitude?: number;
    longitude?: number;
  }>;
  onVenueSelect?: (venue: string) => void;
}

export function VenueMap({ venues, onVenueSelect }: VenueMapProps) {
  const validVenues = venues.filter(v => v.latitude && v.longitude);

  if (validVenues.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-slackey mb-4">venue map</h2>
          <div className="text-muted-foreground">No venue locations available</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate center point from all venues
  const center = validVenues.reduce(
    (acc, venue) => {
      return {
        lat: acc.lat + (venue.latitude || 0) / validVenues.length,
        lng: acc.lng + (venue.longitude || 0) / validVenues.length
      };
    },
    { lat: 0, lng: 0 }
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-slackey mb-4">venue map</h2>
        <div className="h-[400px] w-full rounded-lg overflow-hidden">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={4}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validVenues.map((venue) => (
              <Marker
                key={venue.venue}
                position={[venue.latitude || 0, venue.longitude || 0]}
                eventHandlers={{
                  click: () => onVenueSelect?.(venue.venue)
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-medium">{venue.venue}</h3>
                    <p className="text-sm text-muted-foreground">
                      {venue.count} {venue.count === 1 ? 'show' : 'shows'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}