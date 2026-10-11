import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, usePhantasy, type Core, type Row } from "./data";
import { Card, Chart, Failed, Kpi, Legend, Loading } from "./parts";
import { ANAT, C, anatomyChart, biasChart, fieldChart, raceChart } from "./charts";
import { SortTable, type Col } from "./SortTable";
import type { Nav } from "./nav";

const SET_ORDER: Record<string, number> = { "Set 1": 1, "Set 2": 2, "Set 3": 3, Encore: 9 };
const ord = (r: Row) => (SET_ORDER[r.set] ?? 5) * 100 + r.pos;

export function PhantasyTab({ core, nav }: { core: Core; nav: Nav }) {
  const pf = core.pf_summary;
  const q = usePhantasy();
  const games = useMemo(() => core.pf_shows.filter((r) => r.my_score != null).sort((a, b) => a.date.localeCompare(b.date)), [core]);
  const playable = useMemo(() => games.filter((r) => r.picks != null).reverse(), [games]);
  const sel = nav.game ?? playable[0]?.date ?? null;
  const callRef = useRef<HTMLDivElement>(null);
  const pick = (d: string) => { nav.setGame(d); callRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const tours = useMemo(() => Array.from(new Set((q.data?.pf_race ?? []).map((r) => r.tour as string))), [q.data]);
  const [tour, setTour] = useState<string | null>(null);
  useEffect(() => { if (!tour && tours.length) setTour(tours[tours.length - 1]); }, [tours, tour]);

  if (!pf) return <Loading what="no phantasyfish games yet" />;
  const row = core.pf_shows.find((r) => r.date === sel);
  const picks = (q.data?.pf_picks ?? []).filter((p) => p.date === sel).map((p) => ({ ...p, ord: ord(p) }));
  const actual = (q.data?.pf_actual ?? []).filter((p) => p.date === sel).map((p) => ({ ...p, ord: ord(p) }));
  const race = (q.data?.pf_race ?? []).filter((r) => r.tour === tour);
  const bias = q.data?.pf_bias ?? [];
  const biasCols: Col[] = [{ f: "song", l: "Song", w: true }, { f: "picked", l: "Picked", n: true }, { f: "played", l: "Played", n: true }, { f: "diff", l: "Gap", n: true }];

  return (
    <section className="pb-page">
      <div className="pb-kpis">
        <Kpi dark label="games scored" value={pf.games} sub={`${fmt(pf.total)} points total`} />
        <Kpi label="average" value={fmt(pf.avg, "1")} sub={`low ${pf.worst} · high ${pf.best}`} />
        <Kpi label="overall rank" value={<>{pf.overall_rank}<small style={{ fontSize: 16 }}> / {pf.players}</small></>} sub={`WookBot is ${pf.wook_rank}`} />
        <Kpi label="show wins" value={pf.top_finishes} sub={`top 10 in ${pf.top10} games`} />
        <Kpi label="hit rate" value={fmt(pf.hit_rate, "pct")} sub="picks that scored" />
        <Kpi label="in the room" value={fmt(pf.attended_avg, "1")} sub={`avg at ${pf.attended_games} shows you attended · ${fmt(pf.away_avg, "1")} away`} />
      </div>

      <Card id="field" eb="1 · score vs the field" title="Every game, against everyone"
        note="Your score per show (orange dot) against the field: the bar runs from the median to the top score. The dark tick is WookBot. A ring means you were in the room. Click a show to open your call below.">
        <Legend items={[["you", C.orange], ["median → top", C.soft], ["wookbot", C.night]]} />
        <Chart minHeight={300} draw={(el) => fieldChart(el, core.pf_shows, sel, pick)} deps={[core.pf_shows, sel]} />
      </Card>

      <div ref={callRef} style={{ scrollMarginTop: 72 }}>
        <Card id="call" eb="2 · called it vs played it" title="Your call, side by side with the real setlist">
          <div className="pb-tbar">
            <select aria-label="Show" value={sel ?? ""} onChange={(e) => nav.setGame(e.target.value)}>
              {playable.map((r) => <option key={r.date} value={r.date}>{`${r.date} · ${r.venue} · ${r.my_score} pts`}</option>)}
            </select>
            {row && <span className="cnt">{row.my_score} pts · {row.hits} of {row.picks} picks scored · rank {row.my_rank} of {row.players}</span>}
            {row && core.shows.some((s) => s.date === row.date) && (
              <button type="button" className="pb-btn c-yellow" onClick={() => nav.go("shows", { show: row.date })}>you were there: full setlist</button>
            )}
          </div>
          <Legend items={[["15 special slot", C.yellow], ["10 exact spot", C.green], ["6 right set", C.blue], ["3 in the show", C.peri], ["0 not played", C.line]]} />
          {q.isLoading ? <Loading /> : q.error ? <Failed error={q.error} /> : (
            <div className="pb-two">
              <div>
                <h3>Your picks</h3>
                <div className="pb-tw short">
                  <SortTable key={`p${sel}`} rows={picks} rowKey="key" sort={["ord", "asc"]} rowClass={(p) => `p${p.points}`}
                    cols={[{ f: "set", l: "Set", m: true }, { f: "pos", l: "#", n: true }, { f: "song", l: "Song", w: true }, { f: "points", l: "Pts", n: true }, { f: "outcome", l: "Result", m: true }]} />
                </div>
              </div>
              <div>
                <h3>What they played</h3>
                <p className="note" style={{ marginBottom: 6 }}>Green edge = you had it somewhere.</p>
                <div className="pb-tw short">
                  <SortTable key={`a${sel}`} rows={actual} rowKey="key" sort={["ord", "asc"]} rowClass={(p) => (p.you_picked ? "hit" : undefined)}
                    cols={[{ f: "set", l: "Set", m: true }, { f: "pos", l: "#", n: true }, { f: "song", l: "Song", w: true }]} />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card id="anatomy" eb="3 · where the points come from" title="Points anatomy"
        note="Each show's score split by how it was earned. The bustout bonus goes to every player; the rest is your call.">
        <Legend items={ANAT.map(([, n, c]) => [n, c] as [string, string])} />
        <Chart minHeight={260} draw={(el) => anatomyChart(el, games, pick)} deps={[games]} />
      </Card>

      <div className="pb-grid">
        <Card id="bias" eb="4 · blind spots" title="What you pick vs what they play"
          note="Each dot is a song: how many of your games you picked it (across) against how many of those shows it was played (up). Below the line you over-pick it; above it you're leaving points on the table.">
          {q.isLoading ? <Loading /> : <Chart minHeight={340} draw={(el) => biasChart(el, bias)} deps={[bias]} />}
        </Card>
        <Card eb="4 · blind spots" title="You keep picking" h={3}>
          <div className="pb-tw" style={{ maxHeight: 220 }}><SortTable rows={bias.filter((d) => d.diff > 0)} rowKey="song" sort={["diff", "desc"]} limit={25} cols={biasCols} /></div>
          <h3>You keep missing</h3>
          <div className="pb-tw" style={{ maxHeight: 220 }}><SortTable rows={bias.filter((d) => d.diff < 0)} rowKey="song" sort={["diff", "asc"]} limit={25} cols={biasCols} /></div>
        </Card>
      </div>

      <div className="pb-grid">
        <Card wide id="race" eb="5 · tour standings race" title="You, WookBot and the leaders, show by show"
          note="Running points total across the tour for the top six at the finish, plus you and WookBot.">
          <div className="pb-tbar">
            <select aria-label="Tour" value={tour ?? ""} onChange={(e) => setTour(e.target.value)}>
              {[...tours].reverse().map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {q.isLoading ? <Loading /> : <Chart minHeight={320} draw={(el) => raceChart(el, race)} deps={[race]} />}
        </Card>
        <Card wide id="standings" eb="5 · all-time standings" title="Every player across all scored shows" h={3}>
          <div className="pb-tw" style={{ maxHeight: 360 }}>
            <SortTable rows={q.data?.pf_standings ?? []} rowKey="rank" sort={["rank", "asc"]} rowClass={(r) => (r.is_me ? "sel" : r.is_bot ? "bot" : undefined)}
              cols={[{ f: "rank", l: "#", n: true }, { f: "user", l: "Player", w: true }, { f: "games", l: "Games", n: true }, { f: "total", l: "Points", n: true, bar: true }, { f: "avg", l: "Avg", n: true }]} />
          </div>
        </Card>
      </div>
    </section>
  );
}
