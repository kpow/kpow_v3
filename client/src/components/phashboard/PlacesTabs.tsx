import { todayMD, useOnThisDay, type Core } from "./data";
import { Card, Chart, Failed, Loading } from "./parts";
import { mapChart } from "./charts";
import { SortTable } from "./SortTable";
import type { Nav } from "./nav";

export function VenuesTab({ core, nav }: { core: Core; nav: Nav }) {
  return (
    <section className="pb-page">
      <Card eb="the route" title="Where you've seen them" note="Each dot is a venue, sized by shows. Lines trace your route from show to show in date order.">
        <Chart minHeight={420} draw={(el) => mapChart(el, core.venues, core.shows)} deps={[core.venues, core.shows]} />
      </Card>
      <Card eb="venues" title="Every room and field">
        <div className="pb-tw short">
          <SortTable rows={core.venues} rowKey="venue" sort={["shows", "desc"]}
            onRow={(v, r) => nav.go("shows", { query: v, show: r.last })}
            cols={[{ f: "venue", l: "Venue", w: true }, { f: "location", l: "Where", m: true }, { f: "shows", l: "Shows", n: true, bar: true }, { f: "first", l: "First" },
              { f: "last", l: "Last" }, { f: "years", l: "Years", n: true }, { f: "hours", l: "Hours", n: true }, { f: "jamcharts", l: "Jamcharts", n: true }]} />
        </div>
      </Card>
    </section>
  );
}

const dayOfYear = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86_400_000);
};

export function OnThisDayTab({ core, nav }: { core: Core; nav: Nav }) {
  const md = todayMD();
  const q = useOnThisDay(md);
  const mine = new Set(core.shows.map((s) => s.date));
  const today = dayOfYear(`2001-${md}`);
  const near = core.shows.filter((s) => { const d = Math.abs(dayOfYear(s.date) - today); return Math.min(d, 365 - d) <= 7; });
  const label = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return (
    <section className="pb-page">
      <div className="pb-grid">
        <Card eb="history" title={`Phish on ${label}`} note="Every Phish show played on today's date. Yours are highlighted; click one to open it.">
          {q.isLoading ? <Loading /> : q.error ? <Failed error={q.error} /> : !q.data?.shows.length ? <p className="note">Phish has never played on this date.</p> : (
            <div className="pb-tw short">
              <SortTable rows={q.data.shows} rowKey="date" sort={["date", "desc"]} rowClass={(h) => (h.attended ? "sel" : undefined)}
                onRow={(d) => { if (mine.has(d)) nav.go("shows", { show: d }); }}
                cols={[{ f: "date", l: "Date" }, { f: "venue", l: "Venue", w: true }, { f: "location", l: "Where", m: true }, { f: "tour", l: "Tour", m: true }]} />
            </div>
          )}
        </Card>
        <Card eb="anniversaries" title="Your shows this week, other years" note="Within 7 days of today.">
          {!near.length ? <p className="note">None of your shows fall within a week of today.</p> : (
            <div className="pb-tw short">
              <SortTable rows={near} rowKey="date" sort={["date", "desc"]} onRow={(d) => nav.go("shows", { show: d })}
                cols={[{ f: "date", l: "Date" }, { f: "venue", l: "Venue", w: true }, { f: "songs", l: "Songs", n: true }, { f: "jamcharts", l: "JC", n: true }]} />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
