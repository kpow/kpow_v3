import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import venueData from "@db/show-venues.json";
import "leaflet/dist/leaflet.css";

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
  // Calculate bounds based on all venue coordinates
  const bounds = L.latLngBounds(
    venueData.venues.map((venue) => [venue.latitude, venue.longitude]),
  );

  // Add padding to bounds to ensure all markers are visible
  const paddedBounds = bounds.pad(0.02); // 10% padding

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden [&_.leaflet-pane]:!z-[1]">
      <MapContainer
        bounds={paddedBounds}
        style={{ height: "100%", width: "100%" }}
      >
        {/* <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        /> */}
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
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
