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

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export async function getAttendedShows(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<ShowAttendance>> {
  const url = `/api/shows?page=${page}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch attended shows');
  }

  return response.json();
}

export async function getPaginatedVenues(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<VenueStat>> {
  const url = `/api/venues/stats?page=${page}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch venue statistics');
  }

  return response.json();
}

export async function getShowStats(): Promise<{
  totalShows: number;
  uniqueVenues: number;
}> {
  const response = await fetch('/api/runs/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch show statistics');
  }

  return response.json();
}

export async function getSetlistStats(): Promise<{
  uniqueSongs: number;
}> {
  const response = await fetch('/api/songs/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch song statistics');
  }

  const data = await response.json();
  return {
    uniqueSongs: data.length,
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


export async function getSongOccurrences(songName: string): Promise<any[]> {
  const response = await fetch(`/api/setlist/occurrences/${encodeURIComponent(songName)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch song occurrences');
  }

  return response.json();
}

export interface Setlist {
  showid: string;
  set: string;
  song: string;
  position: number;
}