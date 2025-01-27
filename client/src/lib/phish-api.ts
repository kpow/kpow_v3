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

export async function getSetlist(showId: string): Promise<Setlist[]> {
  const response = await fetch(
    `${PHISH_API_BASE_URL}/setlists/get.json?showid=${showId}&apikey=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }

  const data = await response.json();
  return data.data;
}

export interface SetlistStats {
  uniqueSongs: number;
  songCounts: Record<string, number>;
}

export async function getSetlistStats(username: string): Promise<SetlistStats> {
  // First get all attended shows
  const response = await fetch(
    `${PHISH_API_BASE_URL}/attendance/username/${username}.json?apikey=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch attended shows');
  }

  const data = await response.json();
  const shows = data.data;

  // Create a set to track unique songs and a map for song counts
  const uniqueSongs = new Set<string>();
  const songCounts: Record<string, number> = {};

  // Fetch setlists for each show
  const setlistPromises = shows.map((show: ShowAttendance) =>
    getSetlist(show.showid)
      .then(setlist => {
        setlist.forEach(item => {
          uniqueSongs.add(item.song);
          songCounts[item.song] = (songCounts[item.song] || 0) + 1;
        });
      })
      .catch(error => {
        console.error(`Error fetching setlist for show ${show.showid}:`, error);
      })
  );

  await Promise.all(setlistPromises);

  return {
    uniqueSongs: uniqueSongs.size,
    songCounts
  };
}