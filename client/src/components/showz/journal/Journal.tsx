// "the journal": nights by year then month, newest first, each as the same
// ShowCard the home carousel uses. Whichever entry crosses a line near the top
// of the screen becomes the active night (drives the map + now-showing panel).

import { useEffect, useMemo, useRef } from "react";
import { ShowCard } from "@/components/showz/ShowCard";
import { nightToPost } from "@/lib/showz";
import { dayLabel, fmtNice, MONTHS, plural, shortPlace } from "@/lib/showz-stats";
import type { Night, ShowStats } from "@/lib/showz-stats";

interface Props {
  stats: ShowStats;
  shown: Night[];
  filtering: boolean;
  activeDate: string | null;
  onActive: (date: string) => void;
  onPlay: (n: Night) => void;
}

function Entry({ n, run, on, base, onPlay }: { n: Night; run?: { i: number; of: number }; on: boolean; base: string; onPlay: () => void }) {
  const post = nightToPost(base, n);
  return (
    <div className="min-w-0" data-entry={n.date}>
      <div className="mb-2 flex items-baseline gap-2">
        <span className={`shrink-0 font-mono text-[11px] ${on ? "font-bold text-blue-700" : "text-neutral-500"}`}>{dayLabel(n.date)}</span>
        {run && <span className="shrink-0 rounded bg-blue-50 px-1.5 font-mono text-[10px] text-blue-700">night {run.i}/{run.of}</span>}
        <span className="truncate text-xs text-neutral-600">{shortPlace(n)}</span>
      </div>
      <ShowCard
        id={post.id}
        media_url={post.media_url}
        caption={post.caption}
        timestamp={post.timestamp}
        media_type={post.media_type}
        onClick={onPlay}
      />
    </div>
  );
}

export function Journal({ stats, shown, filtering, activeDate, onActive, onPlay }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;

  const years = useMemo(() => stats.years.slice().reverse(), [stats]);

  useEffect(() => {
    const top = window.innerWidth >= 1024 ? 40 : 55;
    const io = new IntersectionObserver(
      (es) => {
        const hit = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) onActiveRef.current((hit.target as HTMLElement).dataset.entry!);
      },
      { rootMargin: `-${top}% 0px -${100 - top - 8}% 0px` },
    );
    root.current?.querySelectorAll("[data-entry]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  const gap = stats.records.longestGap;

  return (
    <div ref={root} className="min-w-0 space-y-14 lg:order-1">
      {years.map((y) => {
        if (!y.nights) {
          if (filtering) return null;
          return (
            <section key={y.year} className="gap-hatch rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center">
              <h2 className="font-slackey text-4xl text-neutral-300">{y.year}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                No nights filmed. {gap.days} days between {fmtNice(gap.from.date)} and {fmtNice(gap.to.date)}.
              </p>
            </section>
          );
        }
        const ns = shown.filter((n) => n.year === y.year).reverse();
        if (!ns.length) return null;
        const months: { m: number; ns: Night[] }[] = [];
        ns.forEach((n) => {
          const m = +n.date.slice(5, 7) - 1;
          if (!months.length || months[months.length - 1].m !== m) months.push({ m, ns: [] });
          months[months.length - 1].ns.push(n);
        });
        const firsts = stats.firsts[y.year] ?? [];
        return (
          <section key={y.year} data-year={y.year}>
            <div className="mb-6 border-b border-neutral-200 pb-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="font-slackey text-4xl leading-none">{y.year}</h2>
                <p className="font-mono text-xs text-neutral-500">
                  {filtering ? `${ns.length} of ${y.nights} nights · ` : `${plural(y.nights, "night")} · `}
                  {y.clips} clips · {plural(y.venues, "venue")} · most seen: {y.topArtist}
                </p>
              </div>
              {firsts.length > 0 && !filtering && (
                <p className="mt-2 text-xs text-neutral-600">
                  <span className="font-mono uppercase tracking-wider text-blue-700">first time:</span>{" "}
                  {firsts.slice(0, 8).join(", ")}
                  {firsts.length > 8 && ` +${firsts.length - 8} more`}
                </p>
              )}
            </div>
            <ol className="relative ml-1 space-y-8 border-l-2 border-neutral-200 pl-4 sm:ml-2 sm:pl-7">
              {months.map((g) => (
                <li key={g.m} className="relative">
                  <span className="absolute -left-[23px] top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-600/25 sm:-left-[35px]" />
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
                    {MONTHS[g.m]} {y.year}
                  </div>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                    {g.ns.map((n) => (
                      <Entry key={n.date} n={n} run={stats.runs[n.date]} on={n.date === activeDate} base={stats.base} onPlay={() => onPlay(n)} />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
