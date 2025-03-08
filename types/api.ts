// Shared API interfaces
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

export interface SetlistStats {
  uniqueSongs: number;
  songCounts: Record<string, number>;
}
