import { useMemo, useState } from "react";
import { fmt, useSongs, type Core } from "./data";
import { Card, Chart, Failed, Loading } from "./parts";
import { collectionChart, topSongsChart } from "./charts";
import { SortTable } from "./SortTable";
import type { Nav } from "./nav";

export function SongsTab({ core, nav }: { core: Core; nav: Nav }) {
  const q = useSongs();
  const [search, setSearch] = useState("");
  const s = core.summary;
  const coverage = s.originals_total ? s.originals_seen / s.originals_total : 0;
  const collection = useMemo(() => {
    let total = 0;
    return [...core.shows].sort((a, b) => a.n - b.n).map((r) => ({ n: r.n, date: r.date, venue: r.venue, new_songs: r.new_songs, unique_songs: (total += r.new_songs) }));
  }, [core.shows]);
  const songs = q.data?.songs ?? [];
  const seen = useMemo(() => {
    const t = search.trim().toLowerCase();
    return songs.filter((x) => x.seen > 0 && (!t || x.song.toLowerCase().includes(t) || String(x.artist || "").toLowerCase().includes(t)));
  }, [songs, search]);
  const openTrack = (key: string) => nav.go("shows", { show: key.split("#")[0] });
  const showCol = { f: "key", l: "Show", m: true, render: (v: string) => v.split("#")[0] };

  return (
    <section className="pb-page">
      <div className="pb-grid">
        <Card eb="most heard" title="Your top 25">
          <Chart draw={(el) => topSongsChart(el, core.top_songs)} deps={[core.top_songs]} />
        </Card>
        <Card eb="collection curve" title="Different songs, show by show" note="Flattens as the rotation repeats; each step up is a new catch. Click to open that show.">
          <Chart draw={(el) => collectionChart(el, collection, (d) => nav.go("shows", { show: d }))} deps={[collection]} />
          <span className="eb" style={{ marginTop: 8 }}>original catalog</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Slackey, cursive", fontSize: 28 }}>{fmt(coverage, "pct")}</span>
            <span className="note">{s.originals_total - s.originals_seen} originals still out there</span>
          </div>
          <div className="pb-meter"><span style={{ width: `${coverage * 100}%` }} /></div>
        </Card>
        {q.isLoading ? <Card><Loading /></Card> : q.error ? <Card><Failed error={q.error} /></Card> : (
          <>
            <Card eb="chase list" title="Never caught" note="Most-played originals you have never seen live. Times played is Phish's career total.">
              <div className="pb-tw" style={{ maxHeight: 420 }}>
                <SortTable rows={songs.filter((x) => x.seen === 0)} rowKey="song" sort={["played", "desc"]} limit={40}
                  cols={[{ f: "song", l: "Song", w: true }, { f: "played", l: "Times played", n: true, bar: true }]} />
              </div>
            </Card>
            <Card eb="longest" title="Biggest jams you witnessed" note="Top 20 by recorded length. Click to open the show.">
              <div className="pb-tw" style={{ maxHeight: 420 }}>
                <SortTable rows={q.data!.longest} rowKey="key" sort={["minutes", "desc"]} onRow={openTrack}
                  cols={[showCol, { f: "title", l: "Song", w: true }, { f: "minutes", l: "Min", n: true, bar: true }]} />
              </div>
            </Card>
            <Card eb="rarest" title="Biggest gaps you caught" note="Gap = shows since the song was last played.">
              <div className="pb-tw" style={{ maxHeight: 420 }}>
                <SortTable rows={q.data!.rare} rowKey="key" sort={["gap", "desc"]} onRow={openTrack}
                  cols={[showCol, { f: "title", l: "Song", w: true }, { f: "gap", l: "Gap", n: true, bar: true }]} />
              </div>
            </Card>
            <Card wide eb="every song" title="Everything you've heard">
              <div className="pb-tbar">
                <input type="search" placeholder="Search songs" aria-label="Search songs" value={search} onChange={(e) => setSearch(e.target.value)} />
                <span className="cnt">{seen.length} songs</span>
              </div>
              <div className="pb-tw">
                <SortTable rows={seen} rowKey="song" sort={["seen", "desc"]}
                  cols={[{ f: "song", l: "Song", w: true }, { f: "artist", l: "By", m: true }, { f: "seen", l: "Seen", n: true, bar: true }, { f: "played", l: "Played", n: true },
                    { f: "first_seen", l: "First" }, { f: "last_seen", l: "Last" }, { f: "longest_min", l: "Longest", n: true }, { f: "jamcharts_seen", l: "Jamcharts", n: true }]} />
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
