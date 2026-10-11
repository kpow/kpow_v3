export const TABS = [
  { id: "overview", label: "Overview", color: "c-ink" },
  { id: "phantasy", label: "PhantasyFish", color: "c-orange" },
  { id: "songs", label: "Songs", color: "c-blue" },
  { id: "shows", label: "Shows", color: "c-yellow" },
  { id: "venues", label: "Venues", color: "c-green" },
  { id: "onthisday", label: "On this day", color: "c-peri" },
] as const;
export type Tab = (typeof TABS)[number]["id"];

export interface Nav {
  /** Switch tab; optionally select a show (Shows tab) or a game (PhantasyFish tab), or filter shows. */
  go: (tab: Tab, sel?: { show?: string; game?: string; query?: string }) => void;
  show: string | null;
  game: string | null;
  query: string;
  setShow: (d: string) => void;
  setGame: (d: string) => void;
  setQuery: (q: string) => void;
}
