// "the numbers": the all-time band above the journal. Tapping an artist or
// venue filters the journal and map; record tiles open that night's clips.

import { useState } from "react";
import { caption, fmtNice, MONTHS, plural, shortPlace, venueLabel } from "@/lib/showz-stats";
import type { Night, ShowStats } from "@/lib/showz-stats";

export type Filter = { kind: "artist" | "venue"; value: string } | null;

interface Props {
  stats: ShowStats;
  filter: Filter;
  onFilter: (f: Filter) => void;
  onPlay: (n: Night) => void;
}

const label = "font-mono text-[10px] uppercase tracking-wider text-neutral-500";

function Row({ text, val, max, on, onClick }: { text: string; val: number; max: number; on: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`relative flex w-full items-center gap-2 overflow-hidden rounded px-1.5 py-0.5 text-left text-xs ${
          on ? "ring-1 ring-gray-900" : "hover:ring-1 hover:ring-blue-600"
        }`}
      >
        <span
          className={`absolute inset-y-0 left-0 ${on ? "bg-gray-900/15" : "bg-blue-100"}`}
          style={{ width: `${Math.max(6, (val / max) * 100)}%` }}
        />
        <span className={`relative min-w-0 flex-1 truncate ${on ? "font-bold" : "font-medium"}`}>{text}</span>
        <span className="relative shrink-0 font-mono text-[11px] text-neutral-700">{val}</span>
      </button>
    </li>
  );
}

function MiniBars({ labels, vals }: { labels: string[]; vals: number[] }) {
  const max = Math.max(1, ...vals);
  return (
    <>
      {vals.map((v, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${labels[i]}: ${plural(v, "night")}`}>
          <div className="w-full rounded-t-sm bg-blue-600" style={{ height: `${(v / max) * 72}%`, minHeight: v ? 2 : 0 }} />
          <span className="mt-0.5 font-mono text-[9px] leading-none text-neutral-500">{labels[i][0]}</span>
        </div>
      ))}
    </>
  );
}

export function Numbers({ stats, filter, onFilter, onPlay }: Props) {
  const [more, setMore] = useState({ artists: false, venues: false });
  const { totals: t, records: r } = stats;
  const toggle = (kind: "artist" | "venue", value: string) =>
    onFilter(filter?.kind === kind && filter.value === value ? null : { kind, value });

  const tiles: [number, string][] = [
    [t.nights, "nights"], [t.clips, "clips"], [t.hours, "hours"],
    [t.artists, "artists"], [t.venues, "venues"], [t.cities, "cities"],
  ];
  const run = r.longestRun;
  const records: [string, Night, string, string][] = [
    ["first clip", stats.nights[0], String(stats.nights[0].year), caption(stats.nights[0])],
    ["most footage", r.longestNight, `${r.longestNight.minutes.toFixed(1)} min`, caption(r.longestNight)],
    ["most clips", r.mostClipsNight, `${r.mostClipsNight.clips.length} clips`, `${caption(r.mostClipsNight)}, ${shortPlace(r.mostClipsNight)}`],
    ["farthest", r.farthestNight, `${(r.farthestNight.miles ?? 0).toLocaleString()} mi`, `${caption(r.farthestNight)}, ${r.farthestNight.city}`],
    ...(run.length ? [["longest run", run[0], `${run.length} nights`, `${caption(run[0])}, ${shortPlace(run[0])}`] as [string, Night, string, string]] : []),
    ["back after", r.longestGap.to, `${r.longestGap.days} days`, `${caption(r.longestGap.to)}, ${fmtNice(r.longestGap.to.date)}`],
  ];
  const na = more.artists ? 12 : 5, nv = more.venues ? 12 : 5;
  // nights with no venue name lump together as "somewhere in <city>"; keep them off the leaderboard
  const named = stats.venues.filter((v) => v.named);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="font-slackey text-xl">the numbers</h2>
        <span className={label}>
          all-time<span className="hidden sm:inline"> · tap a name to filter</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
        {tiles.map(([v, l]) => (
          <div key={l} className="min-w-0 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-2">
            <div className="font-slackey text-xl leading-none text-gray-900 sm:text-2xl">{v}</div>
            <div className="mt-1 truncate font-mono text-[9px] uppercase tracking-wider text-neutral-500">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3">
        <div className="min-w-0">
          <div className={`mb-1 ${label}`}>most seen · nights</div>
          <ol className="space-y-0.5">
            {stats.artists.slice(0, na).map((a) => (
              <Row key={a.name} text={a.name} val={a.nights} max={stats.artists[0].nights}
                on={filter?.kind === "artist" && filter.value === a.name} onClick={() => toggle("artist", a.name)} />
            ))}
          </ol>
          <button onClick={() => setMore((m) => ({ ...m, artists: !m.artists }))}
            className="mt-1 font-mono text-[10px] uppercase tracking-wider text-blue-600 hover:text-blue-800">
            {more.artists ? "fewer" : `+ ${stats.artists.length - 5} more`}
          </button>
        </div>
        <div className="min-w-0">
          <div className={`mb-1 ${label}`}>home turf · nights</div>
          <ol className="space-y-0.5">
            {named.slice(0, nv).map((v) => (
              <Row key={v.key} text={venueLabel(v)} val={v.nights} max={named[0].nights}
                on={filter?.kind === "venue" && filter.value === v.key} onClick={() => toggle("venue", v.key)} />
            ))}
          </ol>
          <button onClick={() => setMore((m) => ({ ...m, venues: !m.venues }))}
            className="mt-1 font-mono text-[10px] uppercase tracking-wider text-blue-600 hover:text-blue-800">
            {more.venues ? "fewer" : `+ ${named.length - 5} more`}
          </button>
        </div>
        <div className="col-span-2 grid min-w-0 grid-cols-2 gap-4 md:col-span-1 md:grid-cols-1 md:gap-3">
          <div>
            <div className={`mb-1 ${label}`}>day of week</div>
            <div className="flex h-11 items-end gap-1">
              <MiniBars labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} vals={stats.dow} />
            </div>
          </div>
          <div>
            <div className={`mb-1 ${label}`}>month</div>
            <div className="flex h-11 items-end gap-0.5">
              <MiniBars labels={MONTHS} vals={stats.months} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className={`mb-1 px-1 ${label}`}>records · tap to play</div>
        <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6">
          {records.map(([l, n, big, sub]) => (
            <button key={l} onClick={() => onPlay(n)}
              className="w-36 shrink-0 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-left hover:border-blue-600 md:w-auto">
              <div className="font-mono text-[9px] uppercase tracking-wider text-blue-700">{l}</div>
              <div className="font-slackey text-base leading-tight text-gray-900">{big}</div>
              <div className="truncate text-[11px] text-neutral-500">{sub}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
