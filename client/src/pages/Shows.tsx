// k-shows (/shows): the numbers up top, then the tour journal with a sticky
// map that follows the scroll. Design: ~/projects/showz/comps/option-d-journal-plus.html.
// Cards and the player are the home carousel's ShowCard / ShowModal.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/global/SEO";
import { ShowModal } from "@/components/showz/ShowModal";
import { Numbers } from "@/components/showz/journal/Numbers";
import type { Filter } from "@/components/showz/journal/Numbers";
import { Journal } from "@/components/showz/journal/Journal";
import { JournalMap } from "@/components/showz/journal/JournalMap";
import { nightToPost, useShowz } from "@/lib/showz";
import { buildStats, caption, dayLabel, fmtNice, hasArtist, plural, shortPlace, venueLabel } from "@/lib/showz-stats";
import type { Night } from "@/lib/showz-stats";

const HEADER = 64; // fixed site header (Header.tsx, h-16)

export default function Shows() {
  const { data, isLoading, error } = useShowz();
  const stats = useMemo(() => (data?.nights.length ? buildStats(data) : null), [data]);

  const [filter, setFilter] = useState<Filter>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Night | null>(null);
  const [mapOpen, setMapOpen] = useState(true);
  const [zoomTo, setZoomTo] = useState<{ n: Night; at: number } | null>(null);
  const [barH, setBarH] = useState(0);
  const bar = useRef<HTMLDivElement>(null);
  const story = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLElement>(null);

  const shown = useMemo(() => {
    if (!stats) return [];
    if (!filter) return stats.nights;
    return stats.nights.filter((n) => (filter.kind === "artist" ? hasArtist(n, filter.value) : n.venueKey === filter.value));
  }, [stats, filter]);

  // start on the newest night in view; reset when the filter changes
  useEffect(() => {
    if (shown.length) setActiveDate(shown[shown.length - 1].date);
  }, [shown]);
  const active = (activeDate && stats?.byDate[activeDate]) || null;
  // stable array: ShowModal resets to clip 1 whenever `posts` changes identity
  const playingPosts = useMemo(() => (playing && stats ? [nightToPost(stats.base, playing)] : null), [playing, stats]);

  useEffect(() => {
    if (!bar.current) return;
    const ro = new ResizeObserver(() => setBarH(bar.current?.offsetHeight ?? 0));
    ro.observe(bar.current);
    return () => ro.disconnect();
  }, [stats]);

  const applyFilter = useCallback((f: Filter) => {
    setFilter(f);
    requestAnimationFrame(() => {
      if (!story.current) return;
      window.scrollTo({ top: story.current.getBoundingClientRect().top + window.scrollY - HEADER - 48, behavior: "smooth" });
    });
  }, []);

  const jumpTo = useCallback((n: Night) => {
    const el = document.querySelector(`[data-entry="${n.date}"]`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + 60, behavior: "smooth" });
  }, []);

  const filterLabel =
    filter && stats ? (filter.kind === "artist" ? filter.value : venueLabel(stats.venueByKey[filter.value])) : null;
  const yearNights = active ? shown.filter((n) => n.year === active.year) : [];
  const venue = active ? stats?.venueByKey[active.venueKey] : undefined;
  const asideTop = HEADER + barH + (typeof window !== "undefined" && window.innerWidth >= 1024 ? 16 : 0);

  return (
    <div className="mt-4 space-y-5">
      <SEO
        title="k-shows · KPOW"
        description="Every night I pointed a phone at a stage since 2013: the numbers, then the story, with a map that follows along."
        image={stats ? `${stats.base}/clips/${stats.records.mostClipsNight.clips[0].id}.jpg` : undefined}
      />

      <div className="px-1">
        <h1 className="font-slackey text-3xl tracking-tight">k-shows</h1>
        {stats && (
          <p className="text-neutral-500">
            {stats.totals.nights} nights I pointed a phone at a stage, {stats.totals.first.slice(0, 4)} to{" "}
            {stats.totals.last.slice(0, 4)}. The numbers first, then the story.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : error || !stats ? (
        <p className="px-1 text-neutral-600">The shows didn't load. Try again in a minute.</p>
      ) : (
        <>
          {/* pinned only while a filter is on: the active filter chip */}
          <div
            ref={bar}
            className={`sticky top-16 z-30 -mx-2 border-y border-neutral-200 bg-white/95 px-2 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 ${filterLabel ? "" : "hidden"}`}
          >
            <div className="flex items-center gap-2 py-2 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">showing</span>
              <button
                onClick={() => applyFilter(null)}
                className="inline-flex min-w-0 items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 font-medium text-white hover:bg-blue-700"
              >
                <span className="truncate">{filterLabel}</span>
                <span aria-hidden="true">✕</span>
              </button>
              <span className="shrink-0 font-mono text-[10px] text-neutral-500">{plural(shown.length, "night")}</span>
            </div>
          </div>

          <Numbers stats={stats} filter={filter} onFilter={applyFilter} onPlay={setPlaying} />

          <div ref={story} className="border-t-2 border-neutral-900 pt-6">
            <div className="mb-6 flex items-baseline justify-between gap-2 px-1">
              <h2 className="font-slackey text-xl">the journal</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                {filter ? `${plural(shown.length, "night")} of ${stats.totals.nights}` : `${stats.totals.nights} nights`}
              </span>
            </div>
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
              <aside
                ref={aside}
                className="sticky z-20 -mx-2 mb-6 bg-white px-2 pb-2 lg:order-2 lg:mx-0 lg:mb-0 lg:self-start lg:px-0 lg:pb-0"
                style={{ top: asideTop }}
              >
                <div className={`relative ${mapOpen ? "" : "hidden"}`}>
                  <JournalMap stats={stats} shown={shown} year={active?.year ?? null} active={active} onVenue={jumpTo} zoomTo={zoomTo} />
                  {active && (
                    <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-[6] truncate rounded bg-black/75 px-2 py-1 text-xs text-white lg:hidden">
                      {dayLabel(active.date)} {active.year} · {caption(active)} · {shortPlace(active)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setMapOpen((o) => !o)}
                  className="mt-1 w-full text-center font-mono text-[10px] uppercase tracking-wider text-neutral-500 lg:hidden"
                >
                  {mapOpen ? "hide map ▴" : "show map ▾"}
                </button>
                {active && venue && (
                  <div className="mt-4 hidden rounded-lg border border-neutral-200 p-4 lg:block">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-blue-700">
                      now showing · night {yearNights.indexOf(active) + 1} of {yearNights.length} in {active.year}
                    </div>
                    <h3 className="mt-1 font-slackey text-xl leading-tight text-gray-900">{caption(active)}</h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {fmtNice(active.date)} · {active.dow}
                    </p>
                    <p className="text-sm text-neutral-600">📍 {active.place}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5">{plural(active.clips.length, "clip")}</span>
                      <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5">
                        {active.miles ? `${active.miles.toLocaleString()} mi from home` : "home turf"}
                      </span>
                      <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5">
                        visit {venue.dates.indexOf(active.date) + 1} of {venue.nights} here
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setPlaying(active)} className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                        play the night
                      </button>
                      <button
                        onClick={() => setZoomTo({ n: active, at: Date.now() })}
                        className="rounded border border-neutral-200 px-3 py-2 text-xs text-neutral-700 hover:border-blue-600"
                      >
                        zoom in
                      </button>
                    </div>
                  </div>
                )}
              </aside>
              <Journal stats={stats} shown={shown} filtering={!!filter} activeDate={activeDate} onActive={setActiveDate} onPlay={setPlaying} />
            </div>
          </div>

          {playingPosts && (
            <ShowModal
              posts={playingPosts}
              initialPostIndex={0}
              isOpen
              onClose={() => setPlaying(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
