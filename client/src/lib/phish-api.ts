// Interfaces
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

// API Functions
export async function getAttendedShows(
  username: string,
  page = 1,
  limit = 10
): Promise<{ shows: ShowAttendance[]; total: number }> {
  const response = await fetch(`/api/shows?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch attended shows');
  }

  const data = await response.json();
  return {
    shows: data.shows,
    total: data.pagination.total,
  };
}

export async function getShowStats(username: string): Promise<{
  totalShows: number;
  uniqueVenues: number;
  venueStats: VenueStat[];
}> {
  const response = await fetch(`/api/runs/stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch show statistics');
  }

  const data = await response.json();
  const venueResponse = await fetch(`/api/venues/stats?limit=999`);

  if (!venueResponse.ok) {
    throw new Error('Failed to fetch venue statistics');
  }

  const venueData = await venueResponse.json();

  return {
    totalShows: data.totalShows,
    uniqueVenues: data.uniqueVenues,
    venueStats: venueData.venues,
  };
}

export async function getPaginatedVenues(
  username: string,
  page = 1,
  limit = 10
): Promise<{ venues: VenueStat[]; total: number }> {
  const response = await fetch(`/api/venues/stats?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch venue statistics');
  }

  const data = await response.json();
  return {
    venues: data.venues,
    total: data.pagination.total,
  };
}

export async function getSetlist(showId: string): Promise<Setlist[]> {
  const response = await fetch(`/api/setlists/${showId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }

  const data = await response.json();
  return data.setlistdata || [];
}

export interface SetlistStats {
  uniqueSongs: number;
  songCounts: Record<string, number>;
}

export async function getSetlistStats(username: string): Promise<SetlistStats> {
  const response = await fetch(`/api/songs/stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch song statistics');
  }

  const data = await response.json();

  // Convert array of song stats to record format
  const songCounts: Record<string, number> = {};
  data.forEach((song: { name: string; count: number }) => {
    songCounts[song.name] = song.count;
  });

  return {
    uniqueSongs: Object.keys(songCounts).length,
    songCounts,
  };
}

// New function to get song occurrences
export async function getSongOccurrences(songName: string): Promise<any[]> {
  const response = await fetch(`/api/setlist/occurrences/${encodeURIComponent(songName)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch song occurrences');
  }

  return response.json();
}