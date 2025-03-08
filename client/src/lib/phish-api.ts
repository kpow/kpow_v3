// Constants - no need for API key anymore as we're using backend routes
const API_BASE = '/api';

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

export interface Setlist {
  showid: string;
  set: string;
  song: string;
  position: number;
}

export interface SetlistResponse {
  showdate: string;
  venue: string;
  location: string;
  setlistdata: string;
  setlistnotes: string;
}

// API Functions
export async function getAttendedShows(
  username: string,
  page = 1,
  limit = 10
): Promise<{ shows: ShowAttendance[]; total: number }> {
  const response = await fetch(`${API_BASE}/shows?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch attended shows');
  }

  const data = await response.json();
  return {
    shows: data.shows,
    total: data.pagination.total * limit, // Convert pages to total items
  };
}

export async function getShowStats(username: string): Promise<{
  totalShows: number;
  uniqueVenues: number;
  venueStats: VenueStat[];
}> {
  const response = await fetch(`${API_BASE}/runs/stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch show statistics');
  }

  const data = await response.json();

  // Get venue stats in a separate call
  const venueResponse = await fetch(`${API_BASE}/venues/stats`);
  if (!venueResponse.ok) {
    throw new Error('Failed to fetch venue statistics');
  }
  const venueData = await venueResponse.json();

  return {
    totalShows: data.totalShows,
    uniqueVenues: data.uniqueVenues,
    venueStats: venueData.venues
  };
}

export async function getPaginatedVenues(
  username: string
): Promise<{ venues: VenueStat[]; total: number }> {
  const response = await fetch(`${API_BASE}/venues/stats?limit=0`); // Limit=0 means fetch all venues

  if (!response.ok) {
    throw new Error('Failed to fetch venue statistics');
  }

  const data = await response.json();
  return {
    venues: data.venues,
    total: data.venues.length // Total is now the length of the venues array
  };
}

export async function getSetlist(showId: string): Promise<SetlistResponse> {
  const response = await fetch(`${API_BASE}/setlists/${showId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }

  return response.json();
}

export interface SetlistStats {
  uniqueSongs: number;
  songCounts: Record<string, number>;
}

export async function getSetlistStats(username: string): Promise<SetlistStats> {
  const response = await fetch(`${API_BASE}/songs/stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch song statistics');
  }

  const songStats = await response.json();
  const songCounts: Record<string, number> = {};

  songStats.forEach((stat: { name: string; count: number }) => {
    songCounts[stat.name] = stat.count;
  });

  return {
    uniqueSongs: Object.keys(songCounts).length,
    songCounts
  };
}

export async function getShowsByVenue(
  username: string,
  venue: string
): Promise<ShowAttendance[]> {
  const response = await fetch(`${API_BASE}/venues/${encodeURIComponent(venue)}/shows`);

  if (!response.ok) {
    throw new Error('Failed to fetch venue shows');
  }

  return response.json();
}