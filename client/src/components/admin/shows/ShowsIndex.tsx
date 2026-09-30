// The Shows index: search, status filters, a "need a band" tray, and every night
// as a card grouped by year. A card opens /admin/shows/:date.

import { useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useShows } from "./ShowsAdmin";
import { Badges, MiniBar } from "./parts";
import { bandsOf, CDN, counts, isTodo, matches } from "./model";
import type { Filter, Night } from "./model";

function Card({ n }: { n: Night }) {
  const { isDirty } = useShows();
  const c0 = n.clips.find((c) => c.published) ?? n.clips[0];
  const b = bandsOf(n);
  return (
    <Link href={`/admin/shows/${n.night}`} className="card-hover group block min-w-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
      <div className="relative aspect-video bg-black bg-cover bg-center"
        style={c0?.published ? { backgroundImage: `url(${CDN}/${c0.id}.jpg)` } : { background: "#18181b" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1 [&>span]:!bg-zinc-950/85">
          <Badges n={n} dirty={isDirty(n.night)} size="xs" />
        </div>
        <div className="absolute inset-x-2 bottom-2"><MiniBar n={n} h="h-1" /></div>
      </div>
      <div className="p-2.5 sm:p-3">
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="mono text-xs font-semibold text-zinc-300">{n.night}</span>
          <span className="text-[11px] text-zinc-500">{n.dow}</span>
          <span className="ml-auto hidden whitespace-nowrap text-[11px] text-zinc-500 sm:inline">
            {n.clips.length} clip{n.clips.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className={`mt-0.5 truncate text-sm font-semibold ${b.length ? "text-zinc-50" : "text-amber-300"}`}>
          {b.length ? b.join(" + ") : "No band yet"}
        </div>
        <div className="truncate text-xs text-zinc-500">{n.venue || n.city || "no venue"}</div>
      </div>
    </Link>
  );
}

export function ShowsIndex() {
  const { nights, view } = useShows();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const all = nights.map((n) => view(n.night)!);
  const c = counts(all);
  const list = all.filter((n) => matches(n, q, filter));
  const todo = filter === "all" && !q ? all.filter(isTodo) : [];
  const years = Array.from(new Set(list.map((n) => n.night.slice(0, 4))));

  const chip = (id: Filter, label: string, count: number, tone: string) => (
    <button key={id} onClick={() => setFilter(id)}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        filter === id ? "bg-zinc-100 text-zinc-900 ring-zinc-100" : `bg-zinc-900 ring-zinc-800 hover:ring-zinc-600 ${tone}`
      }`}>
      {label} <span className="font-normal opacity-70">{count}</span>
    </button>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative block md:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search band, venue, date" className="inp pl-8" autoComplete="off" />
        </label>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {chip("all", "All", c.all, "text-zinc-300")}
          {chip("todo", "To do", c.todo, "text-amber-300")}
          {chip("offsite", "Not on site", c.offsite, "text-rose-300")}
          {chip("hidden", "Hidden", c.hidden, "text-zinc-300")}
        </div>
        <span className="text-xs text-zinc-500 md:ml-auto">{list.length} nights</span>
      </div>

      {todo.length > 0 && (
        <section className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/[.04] p-3 sm:p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-amber-200">{todo.length} night{todo.length > 1 ? "s" : ""} need a band</h2>
            <button onClick={() => setFilter("todo")} className="text-xs text-amber-300/80 underline hover:text-amber-200">see only these</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
            {todo.map((n) => <Card key={n.night} n={n} />)}
          </div>
        </section>
      )}

      {years.map((y) => {
        const ns = list.filter((n) => n.night.startsWith(y));
        return (
          <div key={y}>
            <h3 className="mb-2 mt-7 flex items-baseline gap-2 text-sm font-semibold text-zinc-300">
              <span className="mono text-base text-zinc-100">{y}</span>
              <span className="text-xs font-normal text-zinc-500">{ns.length} nights</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
              {ns.map((n) => <Card key={n.night} n={n} />)}
            </div>
          </div>
        );
      })}
      {!list.length && (
        <p className="mt-10 text-center text-sm text-zinc-500">
          No nights match. <button onClick={() => { setFilter("all"); setQ(""); }} className="text-blue-400 underline">Show all</button>
        </p>
      )}
    </div>
  );
}
