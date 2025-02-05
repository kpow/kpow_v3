# Show Locations Map Feature Implementation Plan

## Overview
Add a map visualization showing Phish show locations using OpenStreetMap with venue markers.

## Data Structure
Store venue locations in a static JSON file with this structure:
```json
{
  "venues": [
    {
      "id": "venue_id",
      "name": "Venue Name",
      "city": "City",
      "state": "State",
      "country": "Country",
      "coordinates": {
        "lat": 44.4759,
        "lng": -73.2121
      }
    }
  ]
}
```

## Implementation Phases

### Phase 1: Data Preparation
1. Create a script to process the existing show data (allshows.json)
2. Generate a unique list of venues
3. Use OpenStreetMap Nominatim API to geocode venue addresses
4. Save processed data as venues.json

### Phase 2: Map Component Implementation
1. Install and set up react-leaflet for OpenStreetMap integration
2. Create a new MapView component
3. Implement basic map rendering with venue markers
4. Add popup information for venues showing venue details and number of shows

### Phase 3: Stats Page Integration
1. Add MapView component to the stats page
2. Implement loading state for map data
3. Add basic filtering capability by year/era
4. Add legend showing venue frequency

## Technical Details

### Dependencies
- react-leaflet: For rendering OpenStreetMap
- leaflet: Core mapping library
- Static JSON files for venue data

### Component Structure
```tsx
// MapView.tsx
interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  showCount?: number;
}

interface MapViewProps {
  selectedYear?: string;
  onVenueClick?: (venue: Venue) => void;
}
```

### Testing Checkpoints
1. Phase 1:
   - Verify venues.json is generated with correct coordinates
   - Validate data structure matches the schema

2. Phase 2:
   - Confirm map loads with correct markers
   - Verify popup information is accurate
   - Test map interactions (zoom, pan, click)

3. Phase 3:
   - Verify map integration in stats page
   - Test year/era filtering
   - Validate responsive layout

## Notes
- Using static JSON files instead of database for simplicity
- No caching implementation in initial version
- Focus on core functionality first
