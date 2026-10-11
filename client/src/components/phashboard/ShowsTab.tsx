import { useMemo } from "react";
import { fmt, useShowsData, type Core, type Row } from "./data";
import { Card, Chart, Failed, Legend, Loading } from "./parts";
import { C, setStrip, stripsChart } from "./charts";
import { SortTable } from "./SortTable";
import type { Nav } from "./nav";

export function ShowsTab({ core, nav }: { core: Core; nav: Nav }) {
  const q = useShowsData();
  const tracks = q.data?.tracks ?? [];
  const sel = nav.show ?? core.shows[core.shows.length - 1]?.date ?? null;
  const list = useMemo(() => {
    const t = nav.query.trim().toLowerCase();
    if (!t) return core.shows;
    const songHit = new Set(tracks.filter((k) => String(k.title).toLowerCase().includes(t)).map((k) => k.date));
    return core.shows.filter((s) => songHit.has(s.date) || [s.venue, s.location, s.tour, s.date].some((v) => String(v || "").toLowerCase().includes(t)));
  }, [core.shows, tracks, nav.query]);

  return (
    <section className="pb-page">
      <div className="pb-show">
        <Card eb="all shows" title="The run sheet">
          <div className="pb-tbar">
            <input type="search" placeholder="Search venue, city, tour or song" aria-label="Search shows" value={nav.query} onChange={(e) => nav.setQuery(e.target.value)} />
            <span className="cnt">{list.length} shows</span>
          </div>
          <div className="pb-tw" style={{ maxHeight: 760 }}>
            <SortTable rows={list} rowKey="date" sort={["date", "desc"]} selected={sel} onRow={(d) => nav.setShow(d)}
              cols={[{ f: "date", l: "Date" }, { f: "venue", l: "Venue", w: true }, { f: "location", l: "Where", m: true }, { f: "minutes", l: "Min", n: true },
                { f: "songs", l: "Songs", n: true }, { f: "jamcharts", l: "JC", n: true, bar: true }, { f: "bustouts", l: "Bust", n: true }, { f: "new_songs", l: "New", n: true }]} />
          </div>
        </Card>
        <div className="pb-card">
          {q.isLoading ? <Loading /> : q.error ? <Failed error={q.error} /> : <Detail core={core} tracks={tracks} date={sel} nav={nav} />}
        </div>
      </div>
      <Card eb="every show as a strip" title={`${core.shows.length} nights, song by song`}
        note="One row per show, oldest at top. Each block is a song, its width its length; solid blocks are jamchart versions. Click a row to open it. Shows without timed audio are drawn at equal widths.">
        <Legend items={[["set 1", C.blue], ["set 2", C.green], ["set 3+", C.peri], ["encore", C.orange]]} />
        {q.isLoading ? <Loading /> : (
          <Chart minHeight={520} draw={(el) => stripsChart(el, core.shows, tracks, sel, (d) => { nav.setShow(d); window.scrollTo({ top: 0, behavior: "smooth" }); })} deps={[core.shows, tracks, sel]} />
        )}
      </Card>
    </section>
  );
}

function Detail({ core, tracks, date, nav }: { core: Core; tracks: Row[]; date: string | null; nav: Nav }) {
  const s = core.shows.find((r) => r.date === date);
  const ts = useMemo(() => tracks.filter((t) => t.date === date).sort((a, b) => a.pos - b.pos), [tracks, date]);
  if (!s) return null;
  const pf = core.pf_shows.find((r) => r.date === s.date && r.my_score != null);
  const sets = Array.from(new Set(ts.map((t) => t.set as string)));
  const notes = ts.filter((t) => t.note);
  const stat = (v: unknown, label: string) => <span><b>{fmt(v)}</b> {label}</span>;
  return (
    <>
      <div className="pb-dhead">
        <span className="eb">{s.tour}</span>
        <span className="d">{s.date}</span>
        <span>{s.venue}</span>
        <span className="v">{s.location}</span>
      </div>
      <div className="pb-stats">
        {stat(s.n, "th show for you")}{stat(s.minutes, "min")}{stat(s.songs, "songs")}{stat(s.jamcharts, "jamcharts")}{stat(s.bustouts, "bustouts")}{stat(s.new_songs, "new to you")}
      </div>
      <div className="pb-row">
        <a className="pb-btn c-blue" href={s.phishnet} target="_blank" rel="noopener noreferrer">phish.net ↗</a>
        <a className="pb-btn c-green" href={s.phishin} target="_blank" rel="noopener noreferrer">listen on phish.in ↗</a>
        {pf && <button type="button" className="pb-btn c-orange" onClick={() => nav.go("phantasy", { game: s.date })}>your call: {pf.my_score} pts, rank {pf.my_rank}</button>}
      </div>
      <Chart minHeight={24} draw={(el) => setStrip(el, ts)} deps={[ts]} />
      {sets.map((name) => (
        <div key={name}>
          <h3 style={{ margin: "6px 0 4px" }}>{name}</h3>
          <div className="pb-tw short">
            <SortTable key={`${date}-${name}`} rows={ts.filter((t) => t.set === name)} rowKey="key" sort={["pos", "asc"]} rowClass={(k) => (k.jamchart ? "p10" : undefined)}
              cols={[{ f: "pos", l: "#", n: true }, { f: "title", l: "Song", w: true }, { f: "minutes", l: "Min", n: true }, { f: "tags", l: "Tags", m: true }]} />
          </div>
        </div>
      ))}
      {notes.length > 0 && (
        <details>
          <summary>jamchart and bustout notes ({notes.length})</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {notes.map((t) => <p key={t.key} className="pb-jnote"><b>{t.title}: </b>{t.note}</p>)}
          </div>
        </details>
      )}
    </>
  );
}
