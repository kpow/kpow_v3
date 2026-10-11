import { useQuery } from "@tanstack/react-query";

// Phashboard data, one request per part (see server/lib/phashboard). Rows are
// typed loosely on purpose: the server builds them and this page only reads.

export type Row = Record<string, any>;

export interface Core {
  summary: Row; pf_summary: Row | null; years: Row[]; venues: Row[]; shows: Row[]; pf_shows: Row[];
  top_songs: Row[]; latest_tracks: Row[]; built_at: string;
}
export interface Songs { songs: Row[]; longest: Row[]; rare: Row[]; built_at: string }
export interface Shows { tracks: Row[]; built_at: string }
export interface Phantasy { pf_picks: Row[]; pf_actual: Row[]; pf_bias: Row[]; pf_race: Row[]; pf_standings: Row[]; built_at: string }

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `${r.status}`);
  return r.json();
}

const opts = { staleTime: 5 * 60_000, retry: 1 };
export const useCore = () => useQuery({ queryKey: ["/api/phashboard/core"], queryFn: () => get<Core>("/api/phashboard/core"), ...opts });
export const useSongs = (on = true) => useQuery({ queryKey: ["/api/phashboard/songs"], queryFn: () => get<Songs>("/api/phashboard/songs"), enabled: on, ...opts });
export const useShowsData = (on = true) => useQuery({ queryKey: ["/api/phashboard/shows"], queryFn: () => get<Shows>("/api/phashboard/shows"), enabled: on, ...opts });
export const usePhantasy = (on = true) => useQuery({ queryKey: ["/api/phashboard/phantasy"], queryFn: () => get<Phantasy>("/api/phashboard/phantasy"), enabled: on, ...opts });
export const useOnThisDay = (md: string) =>
  useQuery({ queryKey: ["/api/phashboard/onthisday", md], queryFn: () => get<{ shows: Row[] }>(`/api/phashboard/onthisday/${md}`), ...opts });

export const fmt = (v: unknown, kind?: "pct" | "1"): string => {
  if (v == null || v === "") return "—";
  if (typeof v === "number") {
    if (kind === "pct") return `${(v * 100).toFixed(1)}%`;
    if (kind === "1" || !Number.isInteger(v)) return v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return v.toLocaleString("en-US");
  }
  return String(v);
};

export const todayMD = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
