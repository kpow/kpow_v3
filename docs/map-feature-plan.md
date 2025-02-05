# Show Stats Map Feature Implementation Plan

## 1. Dependencies Required
- `leaflet` - For OpenStreetMap integration
- `@types/leaflet` - TypeScript types for Leaflet
- `node-geocoder` - For converting venue addresses to coordinates

## 2. Backend Changes
### 2.1 Venue Geocoding Service
- Create a new endpoint `/api/venues/coordinates` in `phish-routes.ts`
- Implement geocoding service to convert venue addresses to coordinates
- Cache coordinates in the database to avoid repeated API calls
- Add rate limiting to prevent API abuse

### 2.2 Database Schema Updates
```sql
CREATE TABLE venue_coordinates (
  id SERIAL PRIMARY KEY,
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(venue_id)
);
```

## 3. Frontend Implementation
### 3.1 New Components
- Create `VenueMap.tsx` component
- Implement map controls with zoom and pan
- Add markers for venues with show counts
- Include popup information for each venue

### 3.2 Integration Points
- Add to `show-stats.tsx` alongside existing stats
- Use existing venue data from phish-api.ts
- Reuse `PageTitle` and Card components for consistency

### 3.3 Features
- Cluster markers for venues in close proximity
- Color-code markers based on show count
- Show venue details in existing VenueShowsModal
- Add filters for date ranges

## 4. UI/UX Considerations
- Responsive map size across devices
- Loading states with skeleton UI
- Error handling with user feedback
- Interactive tooltips
- Zoom controls placement

## 5. Performance Optimizations
- Implement coordinate caching
- Lazy load map component
- Optimize marker clustering
- Limit initial load to most visited venues

## 6. Implementation Phases

### Phase 1: Basic Integration
1. Set up map component
2. Display single venue locations
3. Basic marker implementation

### Phase 2: Data Enhancement
1. Implement geocoding service
2. Add coordinate caching
3. Create venue markers with basic info

### Phase 3: UI Enhancement
1. Add clustering
2. Implement filters
3. Enhance popups with show details

### Phase 4: Optimization
1. Performance improvements
2. Mobile responsiveness
3. Error handling

## 7. Testing Strategy
- Verify geocoding accuracy
- Test marker clustering
- Validate mobile responsiveness
- Check performance with large datasets
