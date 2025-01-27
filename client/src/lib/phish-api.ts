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

export interface SetlistSong {
  id: string;
  name: string;
  set: string;
}

export interface ShowSetlist {
  showid: string;
  showdate: string;
  venue: string;
  location: string;
  notes?: string;
  songs: SetlistSong[];
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
  const shows = data.data;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    shows: shows.slice(start, end),
    total: shows.length
  };
}

export async function getShowSetlist(showId: string): Promise<ShowSetlist> {
  const response = await fetch(
    `${PHISH_API_BASE_URL}/setlists/showid/${showId}.json?apikey=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }

  const data = await response.json();
  const showData = data.data[0];

  return {
    showid: showData.showid,
    showdate: showData.showdate,
    venue: showData.venue,
    location: `${showData.city}, ${showData.state}, ${showData.country}`,
    notes: showData.notes || undefined,
    songs: showData.songs.map((song: any) => ({
      id: song.id,
      name: song.name,
      set: song.set
    }))
  };
}

export interface VenueStat {
  venue: string;
  count: number;
  shows: ShowAttendance[];
}

export function getVenueStats(
  shows: ShowAttendance[],
  page = 1,
  limit = 6
): { venues: VenueStat[]; total: number } {
  if (!shows || !shows.length) {
    return { venues: [], total: 0 };
  }

  // Group shows by venue
  const venueMap = new Map<string, ShowAttendance[]>();

  shows.forEach(show => {
    const shows = venueMap.get(show.venue) || [];
    shows.push(show);
    venueMap.set(show.venue, shows);
  });

  // Convert to array and sort by show count
  const allVenues = Array.from(venueMap.entries())
    .map(([venue, shows]) => ({
      venue,
      count: shows.length,
      shows
    }))
    .sort((a, b) => b.count - a.count);

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    venues: allVenues.slice(start, end),
    total: allVenues.length
  };
}

export interface SongStats {
  name: string;
  count: number;
  percentage: number;
}

export function calculateSongStats(setlists: ShowSetlist[]): SongStats[] {
  const songCounts = new Map<string, number>();
  let totalSongs = 0;

  setlists.forEach(setlist => {
    setlist.songs.forEach(song => {
      const count = songCounts.get(song.name) || 0;
      songCounts.set(song.name, count + 1);
      totalSongs++;
    });
  });

  return Array.from(songCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalSongs) * 100
    }))
    .sort((a, b) => b.count - a.count);
}