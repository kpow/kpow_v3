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
  username: string,
  page = 1,
  limit = 10
): Promise<{ venues: VenueStat[]; total: number }> {
  const response = await fetch(
    `${API_BASE}/venues/stats?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch venue statistics');
  }

  const data = await response.json();
  return {
    venues: data.venues,
    total: data.pagination.total * limit // Convert pages to total items
  };
}

export async function getSetlist(showId: string): Promise<Setlist[]> {
  const response = await fetch(`${API_BASE}/setlists/${showId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }

  const data = await response.json();
  // Transform the setlist text into the expected format
  const setlistLines = data.setlistdata.split('\n\n');
  const setlist: Setlist[] = [];

  setlistLines.forEach((line: string) => {
    if (!line.trim()) return;

    const [setInfo, songs] = line.split(': ');
    if (!songs) return;

    const set = setInfo.toLowerCase() === 'encore' ? 'e' : setInfo.split(' ')[1];
    let position = 1;

    songs.split(' ').forEach((song: string) => {
      if (song.trim()) {
        setlist.push({
          showid: showId,
          set,
          song: song.replace(/[>,-]$/, '').trim(),
          position: position++
        });
      }
    });
  });

  return setlist;
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