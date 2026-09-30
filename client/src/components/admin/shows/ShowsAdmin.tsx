// /admin/shows: fix a night's bands, venue, date or visibility from anywhere.
// Adding clips and converting video stays in the namer on the Mac; both write
// the same Postgres tables (server/lib/showz-store.ts).

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Clip {
  id: string;
  file: string;
  artist: string;
  local_time: string | null;
  dur: number | null;
  published: boolean;
}
interface Night {
  night: string;
  dow: string;
  venue: string;
  city: string;
  notes: string;
  hidden: boolean;
  updated_at?: string;
  updated_by?: string;
  clips: Clip[];
}

const CDN = "https://kfiles.atl1.cdn.digitaloceanspaces.com/showz/clips";
const bands = (n: Night) => Array.from(new Set(n.clips.map((c) => c.artist).filter(Boolean)));
const todo = (n: Night) => n.clips.some((c) => !c.artist);
const live = (n: Night) => !n.hidden && n.clips.some((c) => c.published) && bands(n).length > 0;

type Filter = "all" | "todo" | "offsite";

export function ShowsAdmin() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<{ rev: number; nights: Night[] }>({
    queryKey: ["/api/admin/showz"],
    queryFn: async () => {
      const r = await fetch("/api/admin/showz");
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Failed to load shows");
      return r.json();
    },
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sel, setSel] = useState<string | null>(null);

  const nights = useMemo(() => (data?.nights ?? []).slice().sort((a, b) => b.night.localeCompare(a.night)), [data]);
  const artists = useMemo(() => Array.from(new Set(nights.flatMap(bands))).sort(), [nights]);
  const shown = nights.filter((n) => {
    if (filter === "todo" && !todo(n)) return false;
    if (filter === "offsite" && live(n)) return false;
    const t = q.trim().toLowerCase();
    return !t || [n.night, n.venue, n.city, ...bands(n)].join(" ").toLowerCase().includes(t);
  });
  const night = nights.find((n) => n.night === sel) ?? null;

  useEffect(() => {
    if (!sel && shown.length) setSel(shown[0].night);
  }, [sel, shown]);

  const save = useMutation({
    mutationFn: async ({ date, patch }: { date: string; patch: Record<string, unknown> }) => {
      const r = await fetch(`/api/admin/showz/nights/${date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      return j;
    },
    onSuccess: (_j, v) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/showz"] });
      qc.invalidateQueries({ queryKey: ["showz"] });
      if (typeof v.patch.date === "string") setSel(v.patch.date);
      toast({ title: "Saved", description: "Live on the site within a minute." });
    },
    onError: (e: Error) => toast({ title: "Not saved", description: e.message, variant: "destructive" }),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-2 flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="band, venue, date" className="pl-8" />
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">All</option>
            <option value="todo">To do</option>
            <option value="offsite">Not on site</option>
          </select>
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {shown.length} of {nights.length} nights
        </p>
        <ul className="max-h-[70vh] divide-y overflow-y-auto rounded-md border">
          {shown.map((n) => (
            <li key={n.night}>
              <button
                onClick={() => setSel(n.night)}
                className={`w-full px-3 py-2 text-left text-sm ${n.night === sel ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-xs font-semibold">
                    {n.night} <span className="text-gray-400">{n.dow}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{n.clips.length} clips</span>
                </div>
                <div className="truncate font-medium">{bands(n).join(" + ") || <span className="text-amber-600">no band yet</span>}</div>
                <div className="flex items-center gap-2 truncate text-xs text-gray-500">
                  <span className="truncate">{n.venue || n.city || "no venue"}</span>
                  {n.hidden && <span className="rounded bg-gray-200 px-1 text-[10px] uppercase">hidden</span>}
                  {!n.hidden && !live(n) && <span className="rounded bg-amber-100 px-1 text-[10px] uppercase text-amber-800">not on site</span>}
                  {todo(n) && <span className="rounded bg-amber-100 px-1 text-[10px] uppercase text-amber-800">to do</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {night ? (
        <NightEditor key={night.night + (night.updated_at ?? "")} night={night} artists={artists} saving={save.isPending}
          onSave={(patch) => save.mutate({ date: night.night, patch })} />
      ) : (
        <p className="text-gray-500">Pick a night.</p>
      )}
    </div>
  );
}

function NightEditor({ night, artists, saving, onSave }: {
  night: Night;
  artists: string[];
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [date, setDate] = useState(night.night);
  const [venue, setVenue] = useState(night.venue);
  const [city, setCity] = useState(night.city);
  const [notes, setNotes] = useState(night.notes);
  const [hidden, setHidden] = useState(night.hidden);
  const [clipArtists, setClipArtists] = useState(night.clips.map((c) => c.artist));
  const [playing, setPlaying] = useState<string | null>(null);

  const patch: Record<string, unknown> = {};
  if (date !== night.night) patch.date = date;
  if (venue !== night.venue) patch.venue = venue;
  if (city !== night.city) patch.city = city;
  if (notes !== night.notes) patch.notes = notes;
  if (hidden !== night.hidden) patch.hidden = hidden;
  const changedClips = night.clips
    .map((c, i) => ({ id: c.id, artist: clipArtists[i].trim() }))
    .filter((c, i) => c.artist !== night.clips[i].artist);
  if (changedClips.length) patch.clips = changedClips;
  const dirty = Object.keys(patch).length > 0;

  const setClip = (i: number, v: string) => setClipArtists((a) => a.map((x, k) => (k === i ? v : x)));
  const fillRest = (i: number) => setClipArtists((a) => a.map((x, k) => (k >= i ? a[i] : x)));

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-slackey text-2xl">{bands({ ...night, clips: night.clips.map((c, i) => ({ ...c, artist: clipArtists[i] })) }).join(" + ") || night.night}</h2>
        {night.updated_by && (
          <span className="text-xs text-gray-400">
            last edit: {night.updated_by} · {night.updated_at ? new Date(night.updated_at).toLocaleString() : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Venue">
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="The National, Richmond VA" />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="On the site">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} className="h-4 w-4" />
            {hidden ? "hidden" : "shown"}
          </label>
        </Field>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Clips · band on stage</div>
        <datalist id="showz-artists">
          {artists.map((a) => <option key={a} value={a} />)}
        </datalist>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {night.clips.map((c, i) => (
            <li key={c.id} className="overflow-hidden rounded-md border">
              <div className="relative aspect-video bg-gray-900">
                {playing === c.id ? (
                  <video src={`${CDN}/${c.id}.mp4`} controls autoPlay className="h-full w-full bg-black object-contain" />
                ) : c.published ? (
                  <button onClick={() => setPlaying(c.id)} className="h-full w-full" aria-label="play clip">
                    <img src={`${CDN}/${c.id}.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">not uploaded yet · publish from the namer</div>
                )}
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 font-mono text-[10px] text-white">
                  {i + 1} · {(c.local_time ?? "").slice(11, 16)} · {Math.round(c.dur ?? 0)}s
                </span>
              </div>
              <div className="flex gap-1 p-2">
                <Input list="showz-artists" value={clipArtists[i]} onChange={(e) => setClip(i, e.target.value)} placeholder="who's on stage" className="h-8 text-sm" />
                {i < night.clips.length - 1 && (
                  <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 px-2 text-xs" title="use this band for every clip after it" onClick={() => fillRest(i)}>
                    ↓ rest
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Field label="Notes (private, never on the site)">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>

      <div className="sticky bottom-0 flex items-center gap-3 border-t bg-white py-3">
        <Button onClick={() => onSave(patch)} disabled={!dirty || saving} className="bg-blue-600 hover:bg-blue-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
        </Button>
        <Button variant="outline" disabled={!dirty || saving} onClick={() => {
          setDate(night.night); setVenue(night.venue); setCity(night.city); setNotes(night.notes);
          setHidden(night.hidden); setClipArtists(night.clips.map((c) => c.artist));
        }}>
          Undo changes
        </Button>
        <span className="text-xs text-gray-500">{dirty ? "unsaved changes" : "no changes"}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  );
}
