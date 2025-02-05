import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import venueData from '@db/show-venues.json';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

export function VenueMap() {
  // Center coordinates for continental USA
  const center: [number, number] = [39.8283, -98.5795];
  const zoom = 4;

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {venueData.venues.map((venue, index) => (
          <Marker
            key={`${venue.venue}-${index}`}
            position={[venue.latitude, venue.longitude]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold mb-1">{venue.venue}</h3>
                <p className="text-sm">
                  {venue.city}, {venue.state}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}