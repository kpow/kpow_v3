// /admin/shows and /admin/shows/:date. Edits are drafts (per night, with undo)
// until saved as a PATCH; the namer on the Mac writes the same tables.
// Design: ~/projects/showz/comps/admin/option-c-stage.html (option C, "Stage").

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAdminChrome } from "@/components/admin/AdminChrome";
import { ShowsIndex } from "./ShowsIndex";
import { NightPage } from "./NightPage";
import { describePatch, inversePatch, patchOf, toDraft, view } from "./model";
import type { Draft, Night, Patch } from "./model";

interface Entry { d: Draft; hist: Draft[]; tag?: string; at?: number }

interface Ctx {
  nights: Night[]; // saved, newest first
  allArtists: string[]; // most-filmed first
  view: (k: string) => Night | undefined;
  patch: (k: string) => Patch;
  isDirty: (k: string) => boolean;
  dirtyKeys: string[];
  edit: (k: string, fn: (d: Draft) => void, tag?: string) => void;
  undo: (k: string) => boolean;
  canUndo: (k: string) => boolean;
  discard: (k: string) => void;
  save: (k: string) => Promise<string | null>; // resolves to the night's (possibly new) date
  saving: boolean;
}

const ShowsCtx = createContext<Ctx | null>(null);
export const useShows = () => useContext(ShowsCtx)!;

async function sendPatch(date: string, p: Patch) {
  const r = await fetch(`/api/admin/showz/nights/${date}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Save failed");
}

export function ShowsAdmin({ date }: { date?: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { setCrumb } = useAdminChrome();
  const { data, isLoading, error } = useQuery<{ rev: number; nights: Night[] }>({
    queryKey: ["/api/admin/showz"],
    queryFn: async () => {
      const r = await fetch("/api/admin/showz");
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Failed to load shows");
      return r.json();
    },
  });

  const nights = useMemo(() => (data?.nights ?? []).slice().sort((a, b) => b.night.localeCompare(a.night)), [data]);
  const byKey = useMemo(() => new Map(nights.map((n) => [n.night, n])), [nights]);
  const allArtists = useMemo(() => {
    const f = new Map<string, number>();
    nights.forEach((n) => n.clips.forEach((c) => c.artist && f.set(c.artist, (f.get(c.artist) ?? 0) + 1)));
    return Array.from(f.entries()).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  }, [nights]);

  const [drafts, setDrafts] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState(false);

  const patch = useCallback((k: string) => { const n = byKey.get(k); return n ? patchOf(n, drafts[k]?.d) : {}; }, [byKey, drafts]);
  const isDirty = useCallback((k: string) => Object.keys(patch(k)).length > 0, [patch]);
  const dirtyKeys = useMemo(() => Object.keys(drafts).filter(isDirty), [drafts, isDirty]);

  const edit = useCallback((k: string, fn: (d: Draft) => void, tag?: string) => {
    const n = byKey.get(k);
    if (!n) return;
    setDrafts((all) => {
      const e = all[k] ?? { d: toDraft(n), hist: [] };
      const now = Date.now();
      // typing in one field within 1.5s is one undo step
      const hist = tag && e.tag === tag && now - (e.at ?? 0) < 1500 && e.hist.length ? e.hist : [...e.hist, e.d].slice(-100);
      const d = { ...e.d, artists: [...e.d.artists] };
      fn(d);
      const next = { ...all, [k]: { d, hist, tag, at: now } };
      if (!Object.keys(patchOf(n, d)).length) delete next[k];
      return next;
    });
  }, [byKey]);

  const undo = useCallback((k: string) => {
    const e = drafts[k];
    if (!e?.hist.length) return false;
    const n = byKey.get(k)!;
    setDrafts((all) => {
      const d = e.hist[e.hist.length - 1];
      const next = { ...all, [k]: { d, hist: e.hist.slice(0, -1) } };
      if (!Object.keys(patchOf(n, d)).length) delete next[k];
      return next;
    });
    return true;
  }, [drafts, byKey]);

  const discard = useCallback((k: string) => setDrafts((all) => { const next = { ...all }; delete next[k]; return next; }), []);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["/api/admin/showz"] });
    qc.invalidateQueries({ queryKey: ["showz"] });
  }, [qc]);

  const save = useCallback(async (k: string) => {
    const n = byKey.get(k), p = patch(k);
    if (!n || !Object.keys(p).length || saving) return null;
    setSaving(true);
    try {
      await sendPatch(k, p);
      const now = p.date ?? k;
      discard(k);
      await qc.invalidateQueries({ queryKey: ["/api/admin/showz"] });
      qc.invalidateQueries({ queryKey: ["showz"] });
      toast({
        title: `Saved ${now}`,
        description: `${describePatch(p)} · live on the site within a minute`,
        className: "border-zinc-700 bg-zinc-900 text-zinc-100",
        action: (
          <ToastAction altText="Undo the save" className="border-zinc-600 hover:bg-zinc-800"
            onClick={async () => {
              try {
                await sendPatch(now, inversePatch(n, p));
                refresh();
                toast({ title: "Reverted", description: `Put ${n.night} back the way it was`, className: "border-zinc-700 bg-zinc-900 text-zinc-100" });
              } catch (e) {
                toast({ title: "Couldn't revert", description: (e as Error).message, variant: "destructive" });
              }
            }}>
            Undo
          </ToastAction>
        ),
      });
      return now;
    } catch (e) {
      toast({ title: "Not saved", description: (e as Error).message, variant: "destructive" });
      return null;
    } finally {
      setSaving(false);
    }
  }, [byKey, patch, saving, discard, qc, toast, refresh]);

  // leaving with unsaved edits asks first
  useEffect(() => {
    if (!dirtyKeys.length) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyKeys.length]);

  const current = date && byKey.has(date) ? date : undefined;
  useEffect(() => {
    setCrumb(
      <>
        {current && (<><span className="text-zinc-600">/</span><span className="mono truncate text-sm text-zinc-300">{current}</span></>)}
        {dirtyKeys.length > 0 && (
          <span className="ml-auto shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-300 ring-1 ring-inset ring-blue-500/40">
            {dirtyKeys.length} unsaved
          </span>
        )}
      </>,
    );
    return () => setCrumb(null);
  }, [current, dirtyKeys.length, setCrumb]);

  const ctx: Ctx = {
    nights, allArtists,
    view: (k) => { const n = byKey.get(k); return n && view(n, drafts[k]?.d); },
    patch, isDirty, dirtyKeys, edit, undo, canUndo: (k) => !!drafts[k]?.hist.length, discard, save, saving,
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>;
  if (error) return <p className="py-10 text-center text-rose-300">{(error as Error).message}</p>;

  return (
    <ShowsCtx.Provider value={ctx}>
      {current ? <NightPage k={current} /> : <ShowsIndex />}
    </ShowsCtx.Provider>
  );
}
