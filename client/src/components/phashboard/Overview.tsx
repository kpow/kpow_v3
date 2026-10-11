import { useMemo } from "react";
import { fmt, todayMD, useOnThisDay, type Core } from "./data";
import { Card, Chart, Kpi } from "./parts";
import { heroYears, miniBars, miniPF, miniVenues, setStrip, yearsChart } from "./charts";
import type { Nav } from "./nav";

export function Overview({ core, nav }: { core: Core; nav: Nav }) {
  const { summary: s, pf_summary: pf } = core;
  const games = useMemo(() => core.pf_shows.filter((r) => r.my_score != null).sort((a, b) => a.date.localeCompare(b.date)), [core]);
  const last20 = games.slice(-20);
  const lastGame = games[games.length - 1];
  const latest = core.shows[core.shows.length - 1];
  const topVenue = core.venues[0];
  const coverage = s.originals_total ? s.originals_seen / s.originals_total : 0;
  const md = todayMD();
  const otd = useOnThisDay(md);
  const earliest = otd.data?.shows?.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <section className="pb-page">
      <div className="pb-hero">
        <div className="l">
          <span className="tag">since {s.first_show} · {core.shows[0]?.venue}</span>
          <h1>{fmt(s.shows)} shows. {s.years_span} years.</h1>
          <p>
            <b>{fmt(s.hours, "1")}</b> hours of Phish, <b>{fmt(s.songs_heard)}</b> songs heard, <b>{fmt(s.unique_songs)}</b> different ones,
            at <b>{s.venues}</b> venues.
            {pf && <> Off-stage you've called <b>{pf.games}</b> setlists on PhantasyFish and sit <b>{pf.overall_rank}</b> of <b>{pf.players}</b> on points.</>}
          </p>
          <div className="pb-row">
            <button type="button" className="pb-btn c-yellow" onClick={() => nav.go("shows")}>every show</button>
            <button type="button" className="pb-btn c-orange" onClick={() => nav.go("phantasy")}>phantasyfish</button>
          </div>
        </div>
        <Chart minHeight={150} draw={(el) => heroYears(el, core.years)} deps={[core.years]} />
      </div>

      <div className="pb-kpis">
        <Kpi label="jamchart versions" value={fmt(s.jamcharts)} sub="picked by phish.net" />
        <Kpi label="bustouts seen" value={fmt(s.bustouts)} sub="long-gap returns" />
        <Kpi label="debuts seen" value={fmt(s.debuts)} sub="first-ever plays" />
        <Kpi label="states + countries" value={`${s.states} · ${s.countries}`} sub="states/provinces · countries" />
        {pf && <Kpi dark label="phantasy avg" value={fmt(pf.avg, "1")} sub={`best ${pf.best} · ${pf.best_date}`} />}
        {pf && <Kpi dark label="vs wookbot" value={`${pf.wins}–${pf.losses}`} sub={`${pf.ties} ties`} />}
      </div>

      <div className="pb-teasers">
        {lastGame && (
          <div className="pb-card pb-tease dark">
            <span className="eb">phantasyfish · last 20 games</span>
            <h3>Score vs the field</h3>
            <div className="line">Last game: <b>{lastGame.my_score}</b> pts, rank <b>{lastGame.my_rank}</b> of <b>{lastGame.players}</b> · {lastGame.date}</div>
            <Chart minHeight={70} draw={(el) => miniPF(el, last20)} deps={[last20]} />
            <button type="button" className="pb-btn c-orange" onClick={() => nav.go("phantasy")}>play by play</button>
          </div>
        )}
        <div className="pb-card pb-tease">
          <span className="eb">songs · most heard</span>
          <h3>Top of your rotation</h3>
          <Chart className="grow" minHeight={96} draw={(el) => miniBars(el, core.top_songs.slice(0, 5))} deps={[core.top_songs]} />
          <div className="line"><b>{s.originals_seen}</b> of <b>{s.originals_total}</b> originals caught</div>
          <div className="pb-meter"><span style={{ width: `${coverage * 100}%` }} /></div>
          <button type="button" className="pb-btn c-blue" onClick={() => nav.go("songs")}>dig in</button>
        </div>
        {latest && (
          <div className="pb-card pb-tease">
            <span className="eb">shows · latest</span>
            <h3>{latest.date}</h3>
            <div className="line"><b>{latest.venue}</b> · opened with <b>{latest.opener}</b> · longest <b>{latest.longest_song}</b> {fmt(latest.longest_min)} min</div>
            <Chart minHeight={22} draw={(el) => setStrip(el, core.latest_tracks, 22)} deps={[core.latest_tracks]} />
            <button type="button" className="pb-btn c-yellow" onClick={() => nav.go("shows", { show: latest.date })}>open setlist</button>
          </div>
        )}
        {topVenue && (
          <div className="pb-card pb-tease">
            <span className="eb">venues · home turf</span>
            <h3>{topVenue.venue}</h3>
            <div className="line"><b>{topVenue.shows}</b> shows from {topVenue.first} to {topVenue.last}</div>
            <Chart className="grow" minHeight={90} draw={(el) => miniVenues(el, core.venues)} deps={[core.venues]} />
            <button type="button" className="pb-btn c-green" onClick={() => nav.go("venues")}>see the map</button>
          </div>
        )}
        <div className="pb-card pb-tease">
          <span className="eb">on this day · {today}</span>
          <h3>{earliest ? earliest.date : otd.isLoading ? "…" : "No Phish on this date"}</h3>
          {earliest && <div className="line">Earliest Phish show on this date: <b>{earliest.venue}</b>, {earliest.location}.</div>}
          <button type="button" className="pb-btn c-peri" onClick={() => nav.go("onthisday")}>time travel</button>
        </div>
      </div>

      <div className="pb-grid">
        <Card wide eb="shows per year" title={`${s.years_span} years on the road`}
          note="Your shows each year. Hover a year for how many Phish played. The empty stretch is the 2000s hiatus and the years you sat out.">
          <Chart draw={(el) => yearsChart(el, core.years)} deps={[core.years]} />
        </Card>
      </div>
    </section>
  );
}
