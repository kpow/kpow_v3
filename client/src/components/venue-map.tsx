import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import L from 'leaflet';

// Create a custom icon using a simpler base64 encoded marker
const defaultIcon = L.icon({
  iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAGmklEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII=",
  shadowUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACMUlEQVR4Ae3ShY7jQBAE0Aoz/f9/HTMzhg1zrdKUrJbdx+Kd2nD8VNudfsL/Th///dyQN2TH6f3y/BGpC379rV+S+qqetBOxImNQXL8JCAr2V4iMQXHGNJxeCfZXhSRBcQMfvkOWUdtfzlLgAENmZDcmo2TVmt8OSM2eXxBp3DjHSMFutqS7SbmemzBiR+xpKCNUIRkdkkYxhAkyGoBvyQFEJEefwSmmvBfJuJ6aKqKWnAkvGZOaZXTUgFqYULWNSHUckZuR1HIIimUExutRxwzOLROIG4vKmCKQt364mIlhSyzAf1m9lHZHJZrlAOMMztRRiKimp/rpdJDc9Awry5xTZCte7FHtuS8wJgeYrHS3ANwPXrIIpD0z7dHlKAfpD4O9YGlAoXHOZdk2kPRTQc9F99fTZ8OKGPWBWw0Kc5+BDkp4WvpIBwJyuMcmWDB1Y7+LVFmYs6tW4rd0oca3ehs3awNQPlHrhAVXMUGcXM38iqHWWntAWd1g4CoRWvuXVvNXM1p/xWbYl5jBJkp4Vt6RJ4N6r/SvbwDivNahBhL+CGeynJvQWnZzuqB+0PQd6bDWNF9BCgD+tVw1yLVskTaoF1g3GkJFGkJFGkJFGkJFGkJFGkJFGkJFGkJFGkJFGgCAD5QRKWxYRwAAAABJRU5ErkJggg==",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

  // Stop click event propagation to prevent modal from opening
  const handleMarkerClick = (e: L.LeafletMouseEvent, venue: string) => {
    e.originalEvent.stopPropagation();
    onVenueSelect?.(venue);
  };

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
                icon={defaultIcon}
                eventHandlers={{
                  click: (e) => handleMarkerClick(e, venue.venue)
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