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
  songs: SetlistSong[];
}

// API Functions
export async function getAttendedShows(username: string): Promise<ShowAttendance[]> {
  const response = await fetch(
    `${PHISH_API_BASE_URL}/attendance/username/${username}.json?apikey=${API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch attended shows');
  }
  
  const data = await response.json();
  return data.data;
}

export async function getShowSetlist(showId: string): Promise<ShowSetlist> {
  const response = await fetch(
    `${PHISH_API_BASE_URL}/setlists/showid/${showId}.json?apikey=${API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }
  
  const data = await response.json();
  return {
    showid: data.data[0].showid,
    showdate: data.data[0].showdate,
    venue: data.data[0].venue,
    songs: data.data[0].songs.map((song: any) => ({
      id: song.id,
      name: song.name,
      set: song.set
    }))
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
