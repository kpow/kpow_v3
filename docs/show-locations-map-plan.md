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

Testing Checkpoints:
- Verify data extraction script correctly parses allshows.json
- Validate venue list for duplicates and missing data
- Test Nominatim API responses for sample venues
- Verify venues.json output matches schema
- Validate coordinates are within expected ranges
- Check for any missing or null values in the output

### Phase 2: Map Component Implementation
1. Install and set up react-leaflet for OpenStreetMap integration
2. Create a new MapView component
3. Implement basic map rendering with venue markers
4. Add popup information for venues showing venue details and number of shows

Testing Checkpoints:
- Verify map loads correctly with test coordinates
- Test marker placement accuracy
- Validate popup content and formatting
- Check map controls (zoom, pan, click interactions)
- Test responsive behavior on different screen sizes
- Verify marker clustering for dense areas

### Phase 3: Stats Page Integration
1. Add MapView component to the stats page
2. Implement loading state for map data
3. Add basic filtering capability by year/era
4. Add legend showing venue frequency

Testing Checkpoints:
- Verify map integration in page layout
- Test data loading states and error handling
- Validate year/era filters affect markers correctly
- Check legend accuracy against data
- Test performance with full venue dataset
- Verify all interactive features work together

## Technical Details

### Dependencies
- react-leaflet: For rendering OpenStreetMap
- leaflet: Core mapping library
- Static JSON files for venue data

### Component Structure
```tsx
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