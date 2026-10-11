// Setlist lookup for the home page's guess-the-setlist game
// (GET /api/setlists/:showId in server/routes/phish-routes.ts). The Phashboard
// has its own data layer: client/src/components/phashboard/data.ts.
import type { ShowAttendance, SetlistResponse } from '../../../types/api';

export type { ShowAttendance };

export async function getSetlist(showId: string): Promise<SetlistResponse> {
  const response = await fetch(`/api/setlists/${showId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }
  return response.json();
}
