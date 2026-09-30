// One night: player on top, the band timeline, "who's on stage" with
// "only this clip" / "this clip onward", every clip's band, and the night's
// details beside it. A save bar slides up when there are unsaved edits.
// Keys: ←/→ or [ ] clips · Enter in the band box = this clip onward,
// Shift+Enter = only this clip · ⌘S save · ⌘Z undo · Esc back to all nights.

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useShows } from "./ShowsAdmin";
import { Badges } from "./parts";
import {
  ago, bandColor, CDN, describePatch, fmtDur, hhmm, isLive, lineup, segments, suggestions, whyOff,
} from "./model";
import type { Night } from "./model";

export function NightPage({ k }: { k: string }) {
  const s = useShows();
  const [, go] = useLocation();
  const n = s.view(k)!;
  const saved = s.nights.find((x) => x.night === k)!;
  const firstTodo = () => Math.max(0, saved.clips.findIndex((c) => !(c.artist ?? "").trim()));
  const [clip, setClipRaw] = useState(firstTodo);
  const [bandText, setBandText] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const vid = useRef<HTMLVideoElement>(null);
  const playNext = useRef(false);

  useEffect(() => { setClipRaw(firstTodo()); setBandText(null); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  const setClip = (i: number) => { setClipRaw(Math.max(0, Math.min(n.clips.length - 1, i))); setBandText(null); };
  const c = n.clips[clip] ?? n.clips[0];
  const a = (c.artist ?? "").trim();
  const last = n.clips.length - 1;
  const typed = bandText ?? a;
  const dirty = s.isDirty(k);

  const assign = (scope: "one" | "rest" | "clear") => {
    const band = scope === "clear" ? "" : typed.trim();
    s.edit(k, (d) => { d.artists = d.artists.map((x, j) => ((scope === "rest" ? j >= clip : j === clip) ? band : x)); });
    setBandText(null);
    if (scope === "one" && clip < last) setClip(clip + 1);
  };
  const doSave = async () => {
    if (!dirty || s.saving) return;
    const now = await s.save(k);
    if (now && now !== k) go(`/admin/shows/${now}`, { replace: true });
  };

  // keyboard
  const latest = useRef({ doSave, clip, setClip, undo: () => s.undo(k), assign });
  latest.current = { doSave, clip, setClip, undo: () => s.undo(k), assign };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName), mod = e.metaKey || e.ctrlKey;
      const L = latest.current;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); L.doSave(); return; }
      if (mod && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); L.undo(); return; }
      if (t.id === "band" && e.key === "Enter") { e.preventDefault(); L.assign(e.shiftKey ? "one" : "rest"); return; }
      if (typing || t.tagName === "VIDEO") return;
      if (e.key === "ArrowRight" || e.key === "]") L.setClip(L.clip + 1);
      if (e.key === "ArrowLeft" || e.key === "[") L.setClip(L.clip - 1);
      if (e.key === "Escape") go("/admin/shows");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // play through: when a clip ends, move on and keep playing
  useEffect(() => {
    if (playNext.current) { playNext.current = false; vid.current?.play().catch(() => {}); }
  }, [clip]);

  const idx = s.nights.findIndex((x) => x.night === k);
  const newer = idx > 0 ? s.nights[idx - 1] : null, older = idx < s.nights.length - 1 ? s.nights[idx + 1] : null;
  const lu = lineup(n);

  return (
    <div className="pb-24">
      {/* header */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/shows" className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-blue-400 hover:bg-zinc-900">
          <ChevronLeft className="h-4 w-4" />All nights
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {older && (
            <Link href={`/admin/shows/${older.night}`} title="older night" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
              <ChevronLeft className="h-4 w-4" /><span className="mono hidden sm:inline">{older.night}</span>
            </Link>
          )}
          {newer && (
            <Link href={`/admin/shows/${newer.night}`} title="newer night" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
              <span className="mono hidden sm:inline">{newer.night}</span><ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="mono text-sm text-zinc-400">{n.night}</span><span className="text-xs text-zinc-500">{n.dow}</span></div>
          <h1 className={`mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl ${lu.length ? "text-zinc-50" : "text-amber-300"}`}>
            {lu.length ? lu.map((x) => x.artist).join(" + ") : "No band yet"}
          </h1>
          <div className="mt-1 text-sm text-zinc-400">{n.venue || "no venue"}{n.city ? ` · ${n.city}` : ""}</div>
        </div>
        <div className="flex flex-wrap gap-1.5 pb-1">
          <Badges n={n} dirty={dirty} />
          {isLive(n) && <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[11px] text-emerald-300 ring-1 ring-inset ring-emerald-400/30">on site</span>}
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* player */}
          <div className="overflow-hidden rounded-xl bg-black ring-1 ring-zinc-800">
            <div className="aspect-video">
              {c.published ? (
                <video key={c.id} ref={vid} src={`${CDN}/${c.id}.mp4`} poster={`${CDN}/${c.id}.full.jpg`} controls playsInline preload="none"
                  className="h-full w-full object-contain"
                  onEnded={() => { if (auto && clip < last) { playNext.current = true; setClip(clip + 1); } }} />
              ) : (
                <div className="grid h-full place-items-center bg-zinc-900 text-center text-sm text-zinc-500">
                  <span>Not uploaded yet<br /><span className="text-xs">publish it from the namer on the Mac</span></span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2 text-sm">
              <button onClick={() => setClip(clip - 1)} disabled={!clip} className="abtn abtn-ghost !p-1.5" aria-label="previous clip"><ChevronLeft className="h-4 w-4" /></button>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-zinc-400">Clip {clip + 1}/{n.clips.length}</span>
                  <Dot n={n} artist={a} />
                  <span className={`truncate font-semibold ${a ? "text-zinc-100" : "text-amber-300"}`}>{a || "who’s on stage?"}</span>
                </div>
                <div className="mono truncate text-[11px] text-zinc-500">{hhmm(c)} · {fmtDur(c.dur)} · {c.file}</div>
              </div>
              <label className="hidden shrink-0 items-center gap-1.5 text-xs text-zinc-400 sm:flex">
                <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-blue-500" /> play through
              </label>
              <button onClick={() => setClip(clip + 1)} disabled={clip >= last} className="abtn abtn-ghost !p-1.5" aria-label="next clip"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <Timeline n={n} clip={clip} onPick={setClip} />

          {/* who's on stage */}
          <AssignPanel n={n} clip={clip} typed={typed} current={a} onType={setBandText} onAssign={assign} />

          <ClipList n={n} saved={saved} clip={clip} onPick={setClip}
            onSet={(i, v) => s.edit(k, (d) => { d.artists[i] = v; })} />
        </div>

        <Details k={k} n={n} saved={saved} />
      </div>

      {/* save bar */}
      <div className={`admin-savebar fixed inset-x-0 bottom-0 z-40 px-2 sm:px-4 ${dirty || s.saving ? "" : "off"}`}
        style={{ paddingBottom: "max(.5rem, env(safe-area-inset-bottom))" }}>
        <div className="container mx-auto">
          <div className="mx-auto flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/95 px-3 py-2.5 shadow-2xl shadow-black/60 backdrop-blur">
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{dirty ? describePatch(s.patch(k)) : "Saving…"}</span>
            <button onClick={() => s.undo(k)} disabled={!s.canUndo(k) || s.saving} className="abtn abtn-ghost !px-3">Undo</button>
            <button onClick={() => s.discard(k)} disabled={!dirty || s.saving} className="abtn abtn-ghost hidden !px-3 sm:inline-flex">Discard</button>
            <button onClick={doSave} disabled={!dirty || s.saving} className="abtn abtn-primary">
              {s.saving && <Loader2 className="h-4 w-4 animate-spin" />}Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ n, artist }: { n: Night; artist: string }) {
  const col = bandColor(n, artist);
  return <span className={`h-2 w-2 shrink-0 rounded-full ${col ? "" : "hatch"}`} style={col ? { background: col } : undefined} />;
}

function Timeline({ n, clip, onPick }: { n: Night; clip: number; onPick: (i: number) => void }) {
  const total = n.clips.reduce((t, c) => t + (c.dur ?? 0), 0);
  return (
    <div className="rounded-xl bg-zinc-900/70 p-3 ring-1 ring-zinc-800">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="lbl !mb-0">Band timeline</span>
        <span className="text-[11px] text-zinc-500">width = clip length · {fmtDur(total)} total</span>
      </div>
      <div className="mb-1 flex h-5 gap-0.5">
        {segments(n).map((sg, i) => {
          const d = n.clips.slice(sg.from, sg.to + 1).reduce((x, c) => x + (c.dur ?? 0), 0);
          const col = bandColor(n, sg.artist);
          return (
            <div key={i} className={`min-w-0 truncate text-[11px] font-semibold ${col ? "" : "text-amber-300"}`}
              style={{ flex: Math.max(d, 20 * (sg.to - sg.from + 1)), ...(col ? { color: col } : {}) }}>
              {sg.artist || "no band"}
            </div>
          );
        })}
      </div>
      <div className="flex h-12 gap-0.5">
        {n.clips.map((c, i) => {
          const a = (c.artist ?? "").trim(), col = bandColor(n, a), on = i === clip;
          return (
            <button key={c.id} onClick={() => onPick(i)} title={`clip ${i + 1} · ${a || "no band"} · ${fmtDur(c.dur)}`}
              className={`tlseg relative min-w-[14px] rounded-[5px] ${col ? "" : "hatch"} ${on ? "z-10 ring-2 ring-white" : ""}`}
              style={{ flex: Math.max(c.dur ?? 0, 20), ...(col ? { background: on ? col : `${col}b3` } : {}) }}>
              <span className={`mono absolute left-1 top-0.5 text-[10px] ${col ? "text-black/70" : "text-amber-100"}`}>{i + 1}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {lineup(n).map((l) => (
          <span key={l.artist} className="inline-flex items-center gap-1.5 text-zinc-300">
            <Dot n={n} artist={l.artist} />{l.artist}
            <span className="text-zinc-500">{l.clips} clip{l.clips > 1 ? "s" : ""} · {fmtDur(l.dur)}</span>
          </span>
        ))}
        {!lineup(n).length && <span className="text-amber-300">No band on any clip yet</span>}
      </div>
    </div>
  );
}

function AssignPanel({ n, clip, typed, current, onType, onAssign }: {
  n: Night; clip: number; typed: string; current: string;
  onType: (v: string) => void; onAssign: (scope: "one" | "rest" | "clear") => void;
}) {
  const { allArtists } = useShows();
  const last = n.clips.length - 1, after = last - clip;
  const t = typed.trim().toLowerCase();
  let sug = suggestions(n, allArtists);
  if (t && t !== current.toLowerCase()) sug = Array.from(new Set([...sug, ...allArtists])).filter((x) => x.toLowerCase().includes(t));
  sug = sug.slice(0, 8);
  const ready = typed.trim() !== "" || current !== "";
  return (
    <div className="rounded-xl bg-zinc-900 p-3 ring-1 ring-zinc-800 sm:p-4">
      <label htmlFor="band" className="text-sm font-semibold text-zinc-100">Who's on stage in clip {clip + 1}?</label>
      <input id="band" value={typed} onChange={(e) => onType(e.target.value)} placeholder="type a band or pick one" autoComplete="off" className="inp mt-2 !py-2.5 !text-base" />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sug.map((x) => {
          const col = bandColor(n, x);
          return (
            <button key={x} onClick={() => onType(x)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                x === typed.trim() ? "border-blue-500 bg-blue-500/15 text-white" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}>
              {col && <span className="h-2 w-2 rounded-full" style={{ background: col }} />}{x}
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onAssign("one")} disabled={!ready} className="abtn abtn-ghost !gap-0 flex-col !py-2.5">
          <span>Only clip {clip + 1}</span><span className="text-[11px] font-normal text-zinc-400">override one clip</span>
        </button>
        <button onClick={() => onAssign("rest")} disabled={!ready} className="abtn abtn-primary !gap-0 flex-col !py-2.5">
          <span>Clip {clip + 1}{after ? ` → ${last + 1}` : ""}</span>
          <span className="text-[11px] font-normal text-blue-100">{after ? `this and the ${after} after it` : "last clip"}</span>
        </button>
      </div>
      {current && <button onClick={() => onAssign("clear")} className="mt-2 text-xs text-zinc-500 hover:text-amber-300">clear clip {clip + 1}</button>}
    </div>
  );
}

function ClipList({ n, saved, clip, onPick, onSet }: {
  n: Night; saved: Night; clip: number; onPick: (i: number) => void; onSet: (i: number, v: string) => void;
}) {
  const lu = lineup(n).map((l) => l.artist);
  return (
    <details className="rounded-xl bg-zinc-900/60 ring-1 ring-zinc-800" open={n.clips.length <= 4}>
      <summary className="cursor-pointer select-none px-3 py-3 text-sm font-semibold text-zinc-200 sm:px-4">
        Every clip · per-clip bands <span className="font-normal text-zinc-500">({n.clips.length})</span>
      </summary>
      <ol className="space-y-1.5 px-2 pb-3 sm:px-3">
        {n.clips.map((c, i) => {
          const a = (c.artist ?? "").trim(), col = bandColor(n, a), changed = a !== saved.clips[i]?.artist;
          const options = Array.from(new Set([...lu, ...(a ? [a] : [])]));
          return (
            <li key={c.id} className={`flex items-center gap-2.5 rounded-lg p-1.5 ${i === clip ? "bg-zinc-800" : ""}`}>
              <button onClick={() => onPick(i)} aria-label={`play clip ${i + 1}`}
                className="relative h-[45px] w-20 shrink-0 overflow-hidden rounded-md bg-black bg-cover bg-center"
                style={c.published ? { backgroundImage: `url(${CDN}/${c.id}.jpg)` } : { background: "#27272a" }}>
                <span className={`absolute inset-x-0 bottom-0 h-1 ${col ? "" : "hatch"}`} style={col ? { background: col } : undefined} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="mono text-[11px] text-zinc-500">#{i + 1} · {hhmm(c)} · {fmtDur(c.dur)}</div>
                <select value={a} className={`inp mt-0.5 !py-1 !text-sm ${a ? "" : "!border-amber-400/40 !text-amber-300"}${changed ? " changed" : ""}`}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v === "__other") { v = window.prompt(`Band on stage for clip ${i + 1}:`, "") ?? ""; if (!v.trim()) return; }
                    onSet(i, v.trim());
                  }}>
                  <option value="">— who's on stage? —</option>
                  {options.map((x) => <option key={x} value={x}>{x}</option>)}
                  <option value="__other">Other band…</option>
                </select>
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function Details({ k, n, saved }: { k: string; n: Night; saved: Night }) {
  const s = useShows();
  const ch = (a: unknown, b: unknown) => (a !== b ? " changed" : "");
  return (
    <aside className="min-w-0 space-y-4">
      <div className="space-y-3 rounded-xl bg-zinc-900 p-3 ring-1 ring-zinc-800 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-100">{n.hidden ? "Hidden" : "On the site"}</div>
            <div className="text-xs text-zinc-500">{n.hidden ? "only admins see it" : isLive(n) ? "public on /shows" : whyOff(n)}</div>
          </div>
          <button role="switch" aria-checked={!n.hidden} aria-label="show on the site" onClick={() => s.edit(k, (d) => { d.hidden = !d.hidden; })}
            className={`relative h-6 w-11 shrink-0 rounded-full ${n.hidden ? "bg-zinc-700" : "bg-emerald-500"} ${n.hidden !== saved.hidden ? "ring-2 ring-blue-500" : ""}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${n.hidden ? "left-0.5" : "left-[22px]"}`} />
          </button>
        </div>
        <div>
          <label className="lbl" htmlFor="f-date">Date</label>
          <input id="f-date" type="date" value={n.night} className={`inp mono${ch(n.night, saved.night)}`}
            onChange={(e) => e.target.value && s.edit(k, (d) => { d.night = e.target.value; })} />
          <p className="mt-1 text-[11px] text-zinc-500">Moving onto a date that already has a night is refused; merge those in the namer.</p>
        </div>
        <div>
          <label className="lbl" htmlFor="f-venue">Venue</label>
          <input id="f-venue" value={n.venue} placeholder="The National, Richmond VA" className={`inp${ch(n.venue, saved.venue)}`}
            onChange={(e) => s.edit(k, (d) => { d.venue = e.target.value; }, "venue")} />
        </div>
        <div>
          <label className="lbl" htmlFor="f-city">City</label>
          <input id="f-city" value={n.city} className={`inp${ch(n.city, saved.city)}`}
            onChange={(e) => s.edit(k, (d) => { d.city = e.target.value; }, "city")} />
        </div>
        <div>
          <label className="lbl" htmlFor="f-notes">Notes · private</label>
          <textarea id="f-notes" rows={4} value={n.notes} placeholder="never shown on the site" className={`inp${ch(n.notes, saved.notes)}`}
            onChange={(e) => s.edit(k, (d) => { d.notes = e.target.value; }, "notes")} />
        </div>
        <div className="text-[11px] text-zinc-500">Last edit: {n.updated_by || "?"} · {ago(n.updated_at)}</div>
      </div>
    </aside>
  );
}
