// Constants
const PHISH_API_BASE_URL = "https://api.phish.net/v5";
const API_KEY = import.meta.env.VITE_PHISH_API_KEY;

export interface ShowAttendance {
  showid: string;
  showdate: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
}

export interface VenueStat {
  venue: string;
  count: number;
}

// API Functions
export async function getAttendedShows(
  username: string,
  page = 1,
  limit = 10
): Promise<{ shows: ShowAttendance[]; total: number }> {
  const response = await fetch(
    `${PHISH_API_BASE_URL}/attendance/username/${username}.json?apikey=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch attended shows');
  }

  const data = await response.json();
  const shows = data.data
    .sort((a: ShowAttendance, b: ShowAttendance) => 
      new Date(b.showdate).getTime() - new Date(a.showdate).getTime()
    );

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    shows: shows.slice(start, end),
    total: shows.length,
  };
}

export async function getShowStats(username: string): Promise<{
  totalShows: number;
  uniqueVenues: number;
  venueStats: VenueStat[];
}> {
  const response = await fetch(
    `${PHISH_API_BASE_URL}/attendance/username/${username}.json?apikey=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch show statistics');
  }

  const data = await response.json();
  const shows = data.data;

  // Count shows per venue
  const venueMap = new Map<string, number>();
  shows.forEach((show: ShowAttendance) => {
    venueMap.set(show.venue, (venueMap.get(show.venue) || 0) + 1);
  });

  // Convert to array and sort by count
  const venueStats = Array.from(venueMap.entries())
    .map(([venue, count]) => ({ venue, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalShows: shows.length,
    uniqueVenues: venueMap.size,
    venueStats
  };
}

export async function getPaginatedVenues(
  username: string,
  page = 1,
  limit = 10
): Promise<{ venues: VenueStat[]; total: number }> {
  const { venueStats } = await getShowStats(username);

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    venues: venueStats.slice(start, end),
    total: venueStats.length
  };
}