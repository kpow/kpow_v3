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