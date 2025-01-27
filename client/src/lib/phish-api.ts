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
  if (!showId) {
    console.error('No showId provided to getSetlist');
    return [];
  }

  console.log('Fetching setlist for show:', showId);
  const response = await fetch(
    `${PHISH_API_BASE_URL}/setlists/show/${showId}.json?apikey=${API_KEY}`
  );

  if (!response.ok) {
    console.error(`Failed to fetch setlist for show ${showId}:`, response.status, response.statusText);
    throw new Error('Failed to fetch setlist');
  }

  const data = await response.json();
  console.log('Raw setlist data for show', showId, ':', data);

  if (!data.data || !Array.isArray(data.data)) {
    console.error('Unexpected setlist data format:', data);
    return [];
  }

  // Extract all songs from the setlist and filter out any entries without a song name
  const setlist = data.data
    .filter((item: any) => {
      if (!item.song || typeof item.song !== 'string') {
        console.log('Filtered out invalid setlist item:', item);
        return false;
      }
      return true;
    })
    .map((item: any) => ({
      showid: item.showid,
      set: item.set,
      song: item.song.trim(),
      position: item.position
    }));

  console.log('Processed setlist for show', showId, ':', setlist);
  return setlist;
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

  // Process shows in smaller batches to avoid overwhelming the API
  const BATCH_SIZE = 5;
  for (let i = 0; i < shows.length; i += BATCH_SIZE) {
    const batchShows = shows.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of shows...`);

    await Promise.all(
      batchShows.map((show: ShowAttendance) =>
        getSetlist(show.showid)
          .then(setlist => {
            console.log(`Got setlist for show ${show.showid}, found ${setlist.length} songs`);
            setlist.forEach(item => {
              if (item.song) {
                uniqueSongs.add(item.song);
                songCounts[item.song] = (songCounts[item.song] || 0) + 1;
              }
            });
          })
          .catch(error => {
            console.error(`Error fetching setlist for show ${show.showid}:`, error);
          })
      )
    );
  }

  console.log('Final count of unique songs:', uniqueSongs.size);
  console.log('Songs seen more than 5 times:',
    Object.entries(songCounts)
      .filter(([_, count]) => count > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  );

  return {
    uniqueSongs: uniqueSongs.size,
    songCounts
  };
}