import * as d3 from "d3";
import type { Row } from "./data";

// d3 drawings for the Phashboard. Each function owns one element: it clears it
// and draws into it at the element's current width. <Chart> (Chart.tsx) calls
// them again when the data or the width changes. Ported from the prototype.

export const C = {
  orange: "#ff8a3d", blue: "#2563eb", green: "#16a34a", peri: "#7aa2ff", yellow: "#ffd23f",
  ink: "#0a0a0a", night: "#0e1014", mute: "#6b7280", line: "#e5e7eb", grid: "#eef0f3", soft: "#d6dae1",
};
const f0 = d3.format(",");
const f1 = d3.format(",.1f");
export const setColor = (set: string) =>
  set.startsWith("Encore") ? C.orange : set === "Set 2" ? C.green : set === "Set 3" || set === "Set 4" ? C.peri : C.blue;

const measure = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
const textW = (s: string, px = 10, mono = true) => {
  if (!measure) return s.length * px * 0.6;
  measure.font = `${px}px ${mono ? "ui-monospace,Menlo,monospace" : "Roboto,system-ui,sans-serif"}`;
  return measure.measureText(s).width;
};

function tip(host: HTMLElement) {
  let t = host.querySelector(":scope > .pb-tip") as HTMLDivElement | null;
  if (!t) { t = document.createElement("div"); t.className = "pb-tip"; t.hidden = true; host.appendChild(t); }
  const el = t;
  return {
    show(ev: MouseEvent, lines: (string | null | undefined)[]) {
      el.replaceChildren(...lines.filter((l) => l != null && l !== "").map((l, i) => {
        const d = document.createElement("div"); if (i === 0) d.className = "k"; d.textContent = String(l); return d;
      }));
      el.hidden = false;
      const hb = host.getBoundingClientRect();
      let x = ev.clientX - hb.left + 12, y = ev.clientY - hb.top + 12;
      if (x + el.offsetWidth > hb.width) x = Math.max(0, ev.clientX - hb.left - el.offsetWidth - 12);
      if (y + el.offsetHeight > hb.height) y = Math.max(0, ev.clientY - hb.top - el.offsetHeight - 12);
      el.style.left = `${x}px`; el.style.top = `${y}px`;
    },
    hide() { el.hidden = true; },
  };
}
/** Start a drawing: a fresh svg of the host's width, keeping the tooltip element. */
function start(host: HTMLElement, H: number) {
  const W = Math.max(200, host.clientWidth);
  const t = tip(host);
  const svg: any = d3.create("svg").attr("width", "100%").attr("viewBox", `0 0 ${W} ${H}`);
  const done = (...before: Node[]) => host.replaceChildren(...before, svg.node(), ...Array.from(host.querySelectorAll(":scope > .pb-tip")));
  return { W, svg, t, done };
}
function yGrid(svg: any, y: any, x0: number, x1: number, ticks = 4, format: (n: number) => string = d3.format("d")) {
  svg.append("g").selectAll("line").data(y.ticks(ticks)).join("line").attr("x1", x0).attr("x2", x1).attr("y1", y).attr("y2", y).attr("stroke", C.grid);
  svg.append("g").selectAll("text").data(y.ticks(ticks)).join("text").attr("x", x0 - 6).attr("y", y).attr("dy", "0.32em").attr("text-anchor", "end").text(format);
}
function labelPlacer(W: number, H: number) {
  const placed: number[][] = [];
  return (px: number, py: number, w: number, h: number, r: number) => {
    const cands = [[px + r, py - h / 2], [px - r - w, py - h / 2], [px - w / 2, py - r - h], [px - w / 2, py + r]];
    const fit = cands.find(([a, b]) => a >= 0 && a + w <= W && b >= 0 && b + h <= H && !placed.some((p) => a < p[0] + p[2] && a + w > p[0] && b < p[1] + p[3] && b + h > p[1]));
    if (fit) placed.push([fit[0], fit[1], w, h]);
    return fit;
  };
}

// ---------------- overview ----------------
export function heroYears(host: HTMLElement, years: Row[]) {
  const H = 150, mb = 18, mt = 18;
  const { W, svg, t, done } = start(host, H);
  const x = d3.scaleBand(years.map((d) => d.year), [0, W]).padding(0.18);
  const y = d3.scaleLinear([0, d3.max(years, (d) => d.my_shows) || 1], [H - mb, mt]);
  svg.append("g").selectAll("rect").data(years).join("rect")
    .attr("x", (d: Row) => x(d.year)).attr("width", x.bandwidth())
    .attr("y", (d: Row) => (d.my_shows ? y(d.my_shows) : H - mb - 2)).attr("height", (d: Row) => (d.my_shows ? y(0) - y(d.my_shows) : 2)).attr("rx", 2)
    .attr("fill", (d: Row) => (d.my_shows ? C.yellow : "#2a2e37"))
    .on("mousemove", (ev: MouseEvent, d: Row) => t.show(ev, [String(d.year), `${d.my_shows} of your shows`, `${d.phish_shows} Phish shows that year`]))
    .on("mouseleave", t.hide);
  if (years.length) [years[0], years[years.length - 1]].forEach((d, i) =>
    svg.append("text").attr("x", (x(d.year) ?? 0) + (i ? x.bandwidth() : 0)).attr("y", H - 4).attr("text-anchor", i ? "end" : "start").style("fill", "#9ca3af").text(d.year));
  svg.append("text").attr("x", 0).attr("y", 10).style("fill", "#9ca3af").text("YOUR SHOWS PER YEAR");
  done();
}

export function miniPF(host: HTMLElement, games: Row[]) {
  const H = 70;
  const { W, svg, t, done } = start(host, H);
  const x = d3.scalePoint(games.map((r) => r.date), [6, W - 6]);
  const y = d3.scaleLinear([0, d3.max(games, (r) => Math.max(r.field_max || 0, r.my_score)) || 1], [H - 4, 6]);
  svg.append("path").datum(games).attr("fill", "none").attr("stroke", "#4b5160").attr("stroke-width", 1.5).attr("d", d3.line<Row>().x((r) => x(r.date)!).y((r) => y(r.field_median ?? 0)));
  svg.append("path").datum(games).attr("fill", "none").attr("stroke", C.orange).attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("d", d3.line<Row>().x((r) => x(r.date)!).y((r) => y(r.my_score)));
  svg.append("g").selectAll("circle").data(games).join("circle").attr("cx", (r: Row) => x(r.date)).attr("cy", (r: Row) => y(r.my_score)).attr("r", 3).attr("fill", C.orange)
    .on("mousemove", (ev: MouseEvent, r: Row) => t.show(ev, [r.date, r.venue, `you ${r.my_score} · median ${r.field_median}`])).on("mouseleave", t.hide);
  done();
}

export function miniBars(host: HTMLElement, top: Row[]) {
  const bh = 14, H = Math.max(20, top.length * (bh + 5));
  const { W, svg, done } = start(host, H);
  if (!top.length) return done();
  const lab = Math.min(W * 0.55, (d3.max(top, (d) => textW(d.song, 12, false)) || 0) + 8);
  const x = d3.scaleLinear([0, top[0].seen], [lab, W - 24]);
  top.forEach((d, i) => {
    const yy = i * (bh + 5);
    svg.append("text").attr("x", lab - 6).attr("y", yy + bh / 2).attr("dy", "0.32em").attr("text-anchor", "end").style("fill", C.ink).style("font-family", "Roboto,sans-serif").style("font-size", "12px").text(d.song);
    svg.append("rect").attr("x", lab).attr("y", yy).attr("height", bh).attr("width", x(d.seen) - lab).attr("rx", 2).attr("fill", i === 0 ? C.blue : C.peri);
    svg.append("text").attr("x", x(d.seen) + 4).attr("y", yy + bh / 2).attr("dy", "0.32em").text(d.seen);
  });
  done();
}

/** One show as a strip of songs, width = length. */
export function setStrip(host: HTMLElement, tracks: Row[], H = 24) {
  const { W, svg, t, done } = start(host, H);
  const ts = [...tracks].sort((a, b) => a.pos - b.pos);
  const total = d3.sum(ts, (k) => k.minutes || 0), eq = !total;
  const x = d3.scaleLinear([0, eq ? ts.length : total], [0, W]);
  let cur = 0;
  ts.forEach((k) => {
    const len = eq ? 1 : k.minutes || 0;
    svg.append("rect").attr("x", x(cur)).attr("width", Math.max(0.5, x(cur + len) - x(cur) - 1)).attr("height", H).attr("rx", 2)
      .attr("fill", setColor(k.set)).attr("opacity", k.jamchart ? 1 : 0.45)
      .on("mousemove", (ev: MouseEvent) => t.show(ev, [k.set, k.title, k.minutes ? `${f1(k.minutes)} min` : "no timing", k.tags])).on("mouseleave", t.hide);
    cur += len;
  });
  done();
}

export function miniVenues(host: HTMLElement, venues: Row[]) {
  const H = 90;
  const { W, svg, done } = start(host, H);
  const pts = venues.filter((r) => r.lat != null);
  if (!pts.length) return done();
  const proj = d3.geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], { type: "MultiPoint", coordinates: pts.map((r) => [r.lon, r.lat]) } as any);
  const r = d3.scaleSqrt([0, d3.max(pts, (v) => v.shows) || 1], [2, 9]);
  svg.append("g").selectAll("circle").data([...pts].sort((a, b) => b.shows - a.shows)).join("circle")
    .attr("cx", (d: Row) => proj([d.lon, d.lat])![0]).attr("cy", (d: Row) => proj([d.lon, d.lat])![1]).attr("r", (d: Row) => r(d.shows))
    .attr("fill", C.green).attr("fill-opacity", 0.7).attr("stroke", "#fff");
  done();
}

export function yearsChart(host: HTMLElement, years: Row[]) {
  const H = 240, m = { t: 16, r: 8, b: 26, l: 28 };
  const { W, svg, t, done } = start(host, H);
  const x = d3.scaleBand(years.map((d) => d.year), [m.l, W - m.r]).padding(0.22);
  const y = d3.scaleLinear([0, d3.max(years, (d) => d.my_shows) || 1], [H - m.b, m.t]).nice();
  yGrid(svg, y, m.l, W - m.r);
  const every = Math.max(1, Math.ceil(34 / x.bandwidth()));
  svg.append("g").selectAll("text").data(years.filter((_, i) => i % every === 0)).join("text").attr("x", (d: Row) => x(d.year)! + x.bandwidth() / 2).attr("y", H - 8).attr("text-anchor", "middle").text((d: Row) => d.year);
  const bw = Math.min(32, x.bandwidth());
  const on = years.filter((d) => d.my_shows > 0);
  svg.append("g").selectAll("rect").data(on).join("rect")
    .attr("x", (d: Row) => x(d.year)! + (x.bandwidth() - bw) / 2).attr("width", bw).attr("y", (d: Row) => y(d.my_shows)).attr("height", (d: Row) => y(0) - y(d.my_shows)).attr("rx", 3).attr("fill", C.blue)
    .on("mousemove", (ev: MouseEvent, d: Row) => t.show(ev, [String(d.year), `${d.my_shows} of your shows`, `${d.phish_shows} Phish shows that year`, `${d.hours} hours recorded`])).on("mouseleave", t.hide);
  svg.append("g").selectAll("text.v").data(on).join("text").attr("x", (d: Row) => x(d.year)! + x.bandwidth() / 2).attr("y", (d: Row) => y(d.my_shows) - 4).attr("text-anchor", "middle").style("fill", C.ink).text((d: Row) => d.my_shows);
  svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#9ca3af");
  done();
}

// ---------------- phantasy ----------------
export function fieldChart(host: HTMLElement, rows: Row[], sel: string | null, onPick: (date: string) => void) {
  const H = 300, m = { t: 22, r: 8, b: 22, l: 30 };
  const { W, svg, t, done } = start(host, H);
  const data = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const x = d3.scaleBand(data.map((r) => r.date), [m.l, W - m.r]).padding(0.25);
  const y = d3.scaleLinear([0, d3.max(data, (r) => Math.max(r.field_max || 0, r.my_score || 0)) || 1], [H - m.b, m.t]).nice();
  yGrid(svg, y, m.l, W - m.r, 5);
  let lastEnd = -1;
  d3.groups(data, (r) => r.tour).forEach(([name, list], i) => {
    const x0 = x(list[0].date)! - (x.step() * x.padding()) / 2 - 1;
    if (i > 0) svg.append("line").attr("x1", x0).attr("x2", x0).attr("y1", m.t - 14).attr("y2", H - m.b).attr("stroke", C.line).attr("stroke-dasharray", "3 3");
    const label = String(name).toUpperCase(), w = textW(label);
    if (x0 + 4 > lastEnd && x0 + 4 + w < W) { svg.append("text").attr("x", x0 + 4).attr("y", m.t - 8).text(label); lastEnd = x0 + 4 + w + 8; }
  });
  const bw = Math.max(2, Math.min(10, x.bandwidth()));
  const cx = (r: Row) => x(r.date)! + x.bandwidth() / 2;
  svg.append("g").selectAll("rect").data(data.filter((r) => r.field_median != null)).join("rect")
    .attr("x", (r: Row) => cx(r) - bw / 2).attr("width", bw).attr("y", (r: Row) => y(r.field_max)).attr("height", (r: Row) => Math.max(1, y(r.field_median) - y(r.field_max))).attr("rx", bw / 2).attr("fill", C.soft);
  svg.append("g").selectAll("line").data(data.filter((r) => r.wook_score != null)).join("line")
    .attr("x1", (r: Row) => cx(r) - bw / 2 - 2).attr("x2", (r: Row) => cx(r) + bw / 2 + 2).attr("y1", (r: Row) => y(r.wook_score)).attr("y2", (r: Row) => y(r.wook_score)).attr("stroke", C.night).attr("stroke-width", 2);
  const me = data.filter((r) => r.my_score != null);
  svg.append("g").selectAll("circle.att").data(me.filter((r) => r.attended)).join("circle").attr("cx", cx).attr("cy", (r: Row) => y(r.my_score)).attr("r", 7.5).attr("fill", "none").attr("stroke", C.ink).attr("stroke-width", 1.5);
  svg.append("g").selectAll("circle.me").data(me).join("circle").attr("cx", cx).attr("cy", (r: Row) => y(r.my_score)).attr("r", (r: Row) => (r.date === sel ? 6 : 4.5))
    .attr("fill", C.orange).attr("stroke", (r: Row) => (r.date === sel ? C.ink : "#fff")).attr("stroke-width", 1.5).style("cursor", "pointer")
    .on("mousemove", (ev: MouseEvent, r: Row) => t.show(ev, [`${r.date} · ${r.tour}`, `${r.venue}, ${r.location}`, `you ${r.my_score} · rank ${r.my_rank} of ${r.players}`, `median ${r.field_median} · top ${r.field_max} · WookBot ${r.wook_score ?? "—"}`, r.attended ? "you were there" : ""]))
    .on("mouseleave", t.hide).on("click", (_: MouseEvent, r: Row) => onPick(r.date));
  done();
}

export const ANAT: [string, string, string][] = [["special", "special slot", C.yellow], ["exact", "exact spot", C.green], ["encore", "encore", C.orange], ["right_set", "right set", C.blue], ["in_show", "in the show", C.peri], ["bustout", "bustout bonus", "#b8bec9"]];
export function anatomyChart(host: HTMLElement, games: Row[], onPick: (date: string) => void) {
  const H = 260, m = { t: 10, r: 8, b: 22, l: 30 };
  const { W, svg, t, done } = start(host, H);
  const data = games.filter((r) => r.exact != null);
  if (!data.length) return done();
  const x = d3.scaleBand(data.map((r) => r.date), [m.l, W - m.r]).padding(0.2);
  const stack = d3.stack<Row>().keys(ANAT.map((a) => a[0])).value((d, k) => d[k] || 0)(data);
  const y = d3.scaleLinear([0, d3.max(stack[stack.length - 1], (d) => d[1]) || 1], [H - m.b, m.t]).nice();
  yGrid(svg, y, m.l, W - m.r);
  stack.forEach((layer, i) => {
    svg.append("g").selectAll("rect").data(layer).join("rect").attr("x", (d: any) => x(d.data.date)).attr("width", x.bandwidth())
      .attr("y", (d: any) => y(d[1])).attr("height", (d: any) => Math.max(0, y(d[0]) - y(d[1]))).attr("fill", ANAT[i][2]).style("cursor", "pointer")
      .on("mousemove", (ev: MouseEvent, d: any) => t.show(ev, [`${d.data.date} · ${d.data.venue}`, ...ANAT.filter(([k]) => d.data[k]).map(([k, n]) => `${n}: ${d.data[k]}`)]))
      .on("mouseleave", t.hide).on("click", (_: MouseEvent, d: any) => onPick(d.data.date));
  });
  let lx = -1e9;
  data.forEach((r, i) => {
    if (i && r.date.slice(0, 4) === data[i - 1].date.slice(0, 4)) return;
    const xx = x(r.date)!;
    if (xx - lx < 56) return;
    lx = xx;
    svg.append("text").attr("x", xx).attr("y", H - 6).text(r.date.slice(0, 7));
  });
  done();
}

export function biasChart(host: HTMLElement, data: Row[]) {
  const H = 340, m = { t: 10, r: 14, b: 30, l: 34 };
  const { W, svg, t, done } = start(host, H);
  if (!data.length) return done();
  const mx = d3.max(data, (d) => Math.max(d.picked, d.played)) || 1;
  const x = d3.scaleLinear([0, mx], [m.l, W - m.r]).nice();
  const y = d3.scaleLinear([0, mx], [H - m.b, m.t]).nice();
  svg.append("g").selectAll("line").data(x.ticks(5)).join("line").attr("x1", x).attr("x2", x).attr("y1", m.t).attr("y2", H - m.b).attr("stroke", C.grid);
  yGrid(svg, y, m.l, W - m.r, 5);
  svg.append("g").selectAll("text.tx").data(x.ticks(5)).join("text").attr("x", x).attr("y", H - m.b + 14).attr("text-anchor", "middle").text(d3.format("d"));
  svg.append("text").attr("x", W - m.r).attr("y", H - 4).attr("text-anchor", "end").text("GAMES YOU PICKED IT →");
  svg.append("text").attr("x", m.l + 4).attr("y", m.t + 10).text("↑ SHOWS IT WAS PLAYED");
  const top = Math.min(x.domain()[1], y.domain()[1]);
  svg.append("line").attr("x1", x(0)).attr("y1", y(0)).attr("x2", x(top)).attr("y2", y(top)).attr("stroke", "#9ca3af").attr("stroke-dasharray", "4 4");
  const groups = d3.groups(data, (d) => `${d.picked},${d.played}`).map(([, list]) => ({ picked: list[0].picked, played: list[0].played, list }));
  svg.append("g").selectAll("circle").data(groups).join("circle").attr("cx", (g: any) => x(g.picked)).attr("cy", (g: any) => y(g.played)).attr("r", (g: any) => 3 + Math.sqrt(g.list.length) * 1.6)
    .attr("fill", (g: any) => (g.picked > g.played ? C.orange : g.picked < g.played ? C.blue : "#9ca3af")).attr("fill-opacity", 0.75).attr("stroke", "#fff")
    .on("mousemove", (ev: MouseEvent, g: any) => t.show(ev, [`picked ${g.picked} · played ${g.played}`, ...g.list.slice(0, 6).map((d: Row) => d.song), g.list.length > 6 ? `+${g.list.length - 6} more` : ""]))
    .on("mouseleave", t.hide);
  const place = labelPlacer(W, H - m.b);
  [...[...data].sort((a, b) => b.diff - a.diff).slice(0, 4), ...[...data].sort((a, b) => a.diff - b.diff).slice(0, 4)].forEach((d) => {
    const w = textW(d.song, 11, false) + 4;
    const fit = place(x(d.picked), y(d.played), w, 13, 8);
    if (fit) svg.append("text").attr("x", fit[0] + 2).attr("y", fit[1] + 6.5).attr("dy", "0.32em").style("fill", C.ink).style("font-family", "Roboto,sans-serif").style("font-size", "11px").text(d.song);
  });
  done();
}

export function raceChart(host: HTMLElement, data: Row[]) {
  const dates = Array.from(new Set(data.map((r) => r.date))).sort();
  const last = dates[dates.length - 1];
  const final = data.filter((r) => r.date === last).sort((a, b) => a.rank - b.rank);
  const keep = new Set(final.slice(0, 6).map((r) => r.user_id));
  final.forEach((r) => { if (r.is_me || r.is_bot) keep.add(r.user_id); });
  const series = d3.groups(data.filter((r) => keep.has(r.user_id)), (r) => r.user_id).map(([id, list]) => {
    const l = [...list].sort((a, b) => a.date.localeCompare(b.date));
    return { id, list: l, me: !!l[0].is_me, bot: !!l[0].is_bot, user: l[0].user as string };
  });
  const H = 320;
  const { W, svg, t, done } = start(host, H);
  if (!series.length) return done();
  const endLab = (d3.max(series, (s) => textW(`${s.user} ${f0(s.list[s.list.length - 1].total)}`, 11, false)) || 0) + 12;
  const m = { t: 12, r: Math.min(endLab, W * 0.4), b: 26, l: 40 };
  const x = d3.scalePoint(dates, [m.l, W - m.r]).padding(0.1);
  const y = d3.scaleLinear([0, d3.max(data, (r) => r.total) || 1], [H - m.b, m.t]).nice();
  yGrid(svg, y, m.l, W - m.r, 5, f0);
  const every = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor((W - m.l - m.r) / 60))));
  svg.append("g").selectAll("text.x").data(dates.filter((_, i) => i % every === 0)).join("text").attr("x", (d: string) => x(d)).attr("y", H - 8).attr("text-anchor", "middle").text((d: string) => d.slice(5));
  const color = (s: { me: boolean; bot: boolean }) => (s.me ? C.orange : s.bot ? C.night : C.peri);
  [...series].sort((a, b) => Number(a.me || a.bot) - Number(b.me || b.bot)).forEach((s) => {
    svg.append("path").datum(s.list).attr("fill", "none").attr("stroke", color(s)).attr("stroke-width", s.me ? 3 : 2).attr("stroke-opacity", s.me || s.bot ? 1 : 0.55)
      .attr("stroke-dasharray", s.bot ? "5 3" : null).attr("stroke-linejoin", "round").attr("stroke-linecap", "round")
      .attr("d", d3.line<Row>().x((r) => x(r.date)!).y((r) => y(r.total)));
    svg.append("g").selectAll("circle").data(s.list).join("circle").attr("cx", (r: Row) => x(r.date)).attr("cy", (r: Row) => y(r.total)).attr("r", s.me ? 3.5 : 2.5).attr("fill", color(s))
      .on("mousemove", (ev: MouseEvent, r: Row) => t.show(ev, [r.date, r.user, `${f0(r.total)} pts · rank ${r.rank}`])).on("mouseleave", t.hide);
  });
  const ends = series.map((s) => ({ s, r: s.list[s.list.length - 1], y: y(s.list[s.list.length - 1].total) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  ends.forEach((e) => svg.append("text").attr("x", x(e.r.date)! + 8).attr("y", e.y).attr("dy", "0.32em")
    .style("fill", e.s.me ? C.ink : e.s.bot ? C.night : C.mute).style("font-family", "Roboto,sans-serif").style("font-size", "11px").style("font-weight", e.s.me ? 700 : 400)
    .text(`${e.r.user} ${f0(e.r.total)}`));
  done();
}

// ---------------- songs ----------------
export function topSongsChart(host: HTMLElement, data: Row[]) {
  const bh = 16, H = data.length * (bh + 5) + 8;
  const { W, svg, t, done } = start(host, H);
  if (!data.length) return done();
  const lab = Math.min(W * 0.45, (d3.max(data, (d) => textW(d.song, 12, false)) || 0) + 10);
  const x = d3.scaleLinear([0, d3.max(data, (d) => d.seen) || 1], [lab, W - 30]);
  const y = d3.scaleBand(data.map((d) => d.song), [4, H - 4]).padding(0.25);
  svg.append("g").selectAll("text").data(data).join("text").attr("x", lab - 8).attr("y", (d: Row) => y(d.song)! + y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end")
    .style("fill", C.ink).style("font-family", "Roboto,sans-serif").style("font-size", "12px").text((d: Row) => d.song);
  svg.append("g").selectAll("rect").data(data).join("rect").attr("x", lab).attr("y", (d: Row) => y(d.song)).attr("height", y.bandwidth()).attr("width", (d: Row) => x(d.seen) - lab).attr("rx", 2)
    .attr("fill", (_: Row, i: number) => (i < 3 ? C.blue : C.peri))
    .on("mousemove", (ev: MouseEvent, d: Row) => t.show(ev, [d.song, `heard ${d.seen} times`, `first ${d.first_seen} · last ${d.last_seen}`, `${d.jamcharts_seen} jamchart versions`, `Phish has played it ${f0(d.played)} times`]))
    .on("mouseleave", t.hide);
  svg.append("g").selectAll("text.v").data(data).join("text").attr("x", (d: Row) => x(d.seen) + 5).attr("y", (d: Row) => y(d.song)! + y.bandwidth() / 2).attr("dy", "0.32em").text((d: Row) => d.seen);
  done();
}

export function collectionChart(host: HTMLElement, data: Row[], onPick: (date: string) => void) {
  const H = 240, m = { t: 14, r: 14, b: 26, l: 34 };
  const { W, svg, t, done } = start(host, H);
  if (!data.length) return done();
  const x = d3.scaleLinear([1, data.length], [m.l, W - m.r]);
  const y = d3.scaleLinear([0, d3.max(data, (r) => r.unique_songs) || 1], [H - m.b, m.t]).nice();
  const g = svg.append("defs").append("linearGradient").attr("id", "pbgrad").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
  [[0, 0.3], [0.5, 0.1], [1, 0]].forEach(([o, a]) => g.append("stop").attr("offset", o).attr("style", `stop-color:${C.blue};stop-opacity:${a}`));
  yGrid(svg, y, m.l, W - m.r, 4, f0);
  svg.append("g").selectAll("text.x").data(x.ticks(5).filter(Number.isInteger)).join("text").attr("x", x).attr("y", H - 8).attr("text-anchor", "middle").text((v: number) => `SHOW ${v}`);
  svg.append("path").datum(data).attr("fill", "url(#pbgrad)").attr("d", d3.area<Row>().x((r) => x(r.n)).y0(y(0)).y1((r) => y(r.unique_songs)));
  svg.append("path").datum(data).attr("fill", "none").attr("stroke", C.blue).attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("d", d3.line<Row>().x((r) => x(r.n)).y((r) => y(r.unique_songs)));
  const last = data[data.length - 1];
  svg.append("circle").attr("cx", x(last.n)).attr("cy", y(last.unique_songs)).attr("r", 3.5).attr("fill", C.blue);
  svg.append("text").attr("x", x(last.n) - 6).attr("y", y(last.unique_songs) - 8).attr("text-anchor", "end").style("fill", C.ink).text(`${f0(last.unique_songs)} SONGS`);
  const dot = svg.append("circle").attr("r", 4).attr("fill", C.blue).attr("opacity", 0);
  const at = (ev: MouseEvent) => data[Math.max(0, Math.min(data.length - 1, Math.round(x.invert(d3.pointer(ev)[0])) - 1))];
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b).attr("fill", "transparent").style("cursor", "pointer")
    .on("mousemove", (ev: MouseEvent) => { const r = at(ev); dot.attr("cx", x(r.n)).attr("cy", y(r.unique_songs)).attr("opacity", 1); t.show(ev, [`show ${r.n} · ${r.date}`, r.venue, `${r.unique_songs} different songs so far`, `+${r.new_songs} new`]); })
    .on("mouseleave", () => { t.hide(); dot.attr("opacity", 0); })
    .on("click", (ev: MouseEvent) => onPick(at(ev).date));
  done();
}

// ---------------- shows ----------------
export function stripsChart(host: HTMLElement, shows: Row[], tracks: Row[], sel: string | null, onPick: (date: string) => void) {
  const rowH = 9, gap = 3;
  const list = [...shows].sort((a, b) => a.date.localeCompare(b.date));
  const H = 8 + list.length * (rowH + gap);
  const { W, svg, t, done } = start(host, H);
  const by = d3.group(tracks, (k) => k.date);
  const lab = W < 520 ? 66 : 190;
  const maxMin = d3.max(list, (s) => s.minutes || 0) || 1;
  const x = d3.scaleLinear([0, maxMin], [lab, W - 4]);
  list.forEach((s, i) => {
    const g = svg.append("g").attr("transform", `translate(0,${4 + i * (rowH + gap)})`).style("cursor", "pointer").on("click", () => onPick(s.date));
    g.append("rect").attr("width", W).attr("y", -1).attr("height", rowH + 2).attr("fill", s.date === sel ? "#fff7d6" : "transparent");
    g.append("text").attr("x", lab - 8).attr("y", rowH / 2).attr("dy", "0.32em").attr("text-anchor", "end").attr("font-size", 9)
      .text(W < 520 ? s.date.slice(2) : `${s.date} ${s.venue.length > 16 ? s.venue.slice(0, 15) + "…" : s.venue}`);
    const ts = [...(by.get(s.date) || [])].sort((a, b) => a.pos - b.pos);
    const eq = !s.minutes, unit = eq ? (maxMin * 0.6) / Math.max(1, ts.length) : 0;
    let cur = 0;
    ts.forEach((k) => {
      const len = eq ? unit : k.minutes || 0;
      g.append("rect").attr("x", x(cur)).attr("width", Math.max(0.5, x(cur + len) - x(cur) - 0.8)).attr("height", rowH).attr("rx", 1.5)
        .attr("fill", setColor(k.set)).attr("opacity", eq ? 0.3 : k.jamchart ? 1 : 0.4)
        .on("mousemove", (ev: MouseEvent) => t.show(ev, [`${k.date} · ${k.set}`, k.title, k.minutes ? `${f1(k.minutes)} min` : "no timing", k.tags])).on("mouseleave", t.hide);
      cur += len;
    });
  });
  done();
}

// ---------------- venues ----------------
export function mapChart(host: HTMLElement, venues: Row[], shows: Row[]) {
  const W0 = Math.max(200, host.clientWidth);
  const H = Math.max(360, Math.min(520, W0 * 0.55));
  const { W, svg, t, done } = start(host, H);
  const vs = venues.filter((v) => v.lat != null);
  if (!vs.length) return done();
  const sh = shows.filter((s) => s.lat != null).sort((a, b) => a.date.localeCompare(b.date));
  const proj = d3.geoMercator().fitExtent([[40, 30], [W - 40, H - 30]], { type: "MultiPoint", coordinates: vs.map((v) => [v.lon, v.lat]) } as any);
  const path = d3.geoPath(proj);
  svg.append("path").datum(d3.geoGraticule().step([5, 5])()).attr("d", path).attr("fill", "none").attr("stroke", C.grid);
  const legs: any[] = [];
  for (let i = 1; i < sh.length; i++) {
    const a = sh[i - 1], b = sh[i];
    if (a.lat !== b.lat || a.lon !== b.lon) legs.push({ type: "LineString", coordinates: [[a.lon, a.lat], [b.lon, b.lat]] });
  }
  svg.append("g").selectAll("path").data(legs).join("path").attr("d", path).attr("fill", "none").attr("stroke", C.peri).attr("stroke-width", 1).attr("stroke-opacity", 0.6);
  const r = d3.scaleSqrt([0, d3.max(vs, (v) => v.shows) || 1], [0, 18]);
  svg.append("g").selectAll("circle").data([...vs].sort((a, b) => b.shows - a.shows)).join("circle")
    .attr("cx", (v: Row) => proj([v.lon, v.lat])![0]).attr("cy", (v: Row) => proj([v.lon, v.lat])![1]).attr("r", (v: Row) => Math.max(3, r(v.shows)))
    .attr("fill", C.green).attr("fill-opacity", 0.75).attr("stroke", "#fff").attr("stroke-width", 1.5)
    .on("mousemove", (ev: MouseEvent, v: Row) => t.show(ev, [v.location, v.venue, `${v.shows} shows · ${v.first.slice(0, 4)}–${v.last.slice(0, 4)}`, `${v.hours} hours · ${v.jamcharts} jamcharts`]))
    .on("mouseleave", t.hide);
  const place = labelPlacer(W, H);
  d3.rollups(vs, (L) => ({ shows: d3.sum(L, (v) => v.shows), lon: L[0].lon, lat: L[0].lat }), (v) => v.location)
    .sort((a, b) => b[1].shows - a[1].shows)
    .forEach(([loc, o]) => {
      const [px, py] = proj([o.lon, o.lat])!;
      const label = `${String(loc).split(",")[0]} ${o.shows}`.toUpperCase();
      const fit = place(px, py, textW(label) + 4, 12, Math.max(3, r(o.shows)) + 3);
      if (fit) svg.append("text").attr("x", fit[0] + 2).attr("y", fit[1] + 6).attr("dy", "0.32em").style("fill", C.ink).text(label);
    });
  done();
}
