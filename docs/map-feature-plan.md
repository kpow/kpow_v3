interface VenueCache {
  [venueKey: string]: {
    lat: number;
    lng: number;
    timestamp: number;
  }
}
```

### 4. Frontend Implementation
a) Map Component Features
- Interactive OpenStreetMap display
- Cluster markers for venues with multiple shows
- Popup information showing venue details and show counts
- Zoom controls and responsive design

b) UI Integration
- Add to existing show stats layout
- Implement loading states with existing Skeleton components
- Error handling for geocoding failures
- Responsive design considerations

### 5. Performance Optimizations
- Client-side caching in localStorage
- Marker clustering for dense areas
- Lazy loading of map component
- Rate limiting for geocoding requests
- Optimize marker updates

## Technical Requirements
- leaflet for map rendering
- Existing shadcn components for UI
- Browser localStorage API for caching

## Implementation Details

### 1. Caching Logic
```typescript
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

async function getVenueCoordinates(venue: string): Promise<[number, number]> {
  const cached = localStorage.getItem(`venue_${venue}`);
  if (cached) {
    const data = JSON.parse(cached);
    if (isCacheValid(data.timestamp)) {
      return [data.lat, data.lng];
    }
  }
  // Fetch and cache new coordinates
  // ...
}
```

### 2. Error Handling
- Implement fallback coordinates for failed geocoding
- Show user-friendly error messages
- Retry failed requests with exponential backoff
- Cache successful responses

## User Interface Example
```tsx
<Card className="mb-8">
  <CardContent className="pt-6">
    <PageTitle size="lg">venue map</PageTitle>
    <div className="h-[500px] w-full mt-4">
      <VenueMap venues={venues} />
    </div>
  </CardContent>
</Card>