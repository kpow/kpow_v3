import { getJSON, mapLimit, HOUR, DAY } from "./http";

// Builds every Phashboard dataset from three public sources:
//   phish.net    koolyp's attendance list (PHISH_API_KEY)
//   phish.in     setlists, track lengths, gaps, jamchart tags, song catalog
//   phantasyfish kpow's predictions, scores, leaderboards and WookBot
// The output shapes match the Claude dashboard this page was prototyped in.

const PHISHNET_USER = process.env.PHASHBOARD_PHISHNET_USER || "koolyp";
const PF_BASE = process.env.PHANTASYFISH_URL || "https://phantasyfish.net";
const PF_USER = Number(process.env.PHASHBOARD_PF_USER || 6);
const WOOKBOT = 3;
const PHISHIN = "https://phish.in/api/v2";

const PSEUDO = new Set(["Soundcheck", "Big Ball Jam", "Narration", "Audience Chess Move", "Jam", "Banter", "Tuning", "Intro", "Crowd Noise", "Unknown"]);
const SET_LABEL: Record<string, string> = { set1: "Set 1", set2: "Set 2", encore: "Encore" };

const daysAgo = (date: string) => (Date.now() - new Date(date + "T12:00:00Z").getTime()) / DAY;
/** Old shows are settled; recent ones still get fixes upstream. */
const ageFor = (date: string) => (daysAgo(date) > 21 ? 30 * DAY : 3 * HOUR);
const r1 = (n: number) => Math.round(n * 10) / 10;
const median = (a: number[]) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

// ---------- source shapes (trimmed) ----------
interface Attend { showid: number; date: string; venue: string; city: string; state: string; country: string }
interface PiSong { title: string; played: number; gap: number | null; original: boolean; artist: string }
interface PiTrack { set: string; pos: number; title: string; ms: number; tags: { name: string; notes: string }[]; songs: PiSong[] }
interface PiShow { ms: number; tour: string; venue: string; lat: number | null; lon: number | null; location: string; audio: string; tracks: PiTrack[] }

async function attendance(): Promise<Attend[]> {
  const key = process.env.PHISH_API_KEY;
  if (!key) throw new Error("PHISH_API_KEY is not set");
  const data = await getJSON<Attend[]>(
    `https://api.phish.net/v5/attendance/username/${PHISHNET_USER}.json?apikey=${key}`,
    3 * HOUR,
    {
      key: `phishnet:attendance:${PHISHNET_USER}`,
      pick: (b) =>
        (b.data || [])
          .filter((s: any) => s.artistid == null || Number(s.artistid) === 1)
          .map((s: any) => ({ showid: Number(s.showid), date: s.showdate, venue: s.venue, city: s.city, state: s.state, country: s.country })),
    },
  );
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

function pickShow(d: any): PiShow {
  return {
    ms: d.duration || 0,
    tour: d.tour_name || "",
    venue: d.venue?.name || d.venue_name || "",
    lat: d.venue?.latitude ?? null,
    lon: d.venue?.longitude ?? null,
    location: d.venue?.location || "",
    audio: d.audio_status || "",
    tracks: (d.tracks || []).map((t: any) => ({
      set: t.set_name,
      pos: t.position,
      title: t.title,
      ms: t.duration || 0,
      tags: (t.tags || []).map((g: any) => ({ name: g.name, notes: g.notes || "" })),
      songs: (t.songs || []).map((s: any) => ({ title: s.title, played: s.tracks_count, gap: s.previous_performance_gap ?? null, original: !!s.original, artist: s.artist || "" })),
    })),
  };
}

async function pagesOf<T>(url: string, field: string, map: (x: any) => T): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 20; page++) {
    const body = await getJSON<{ items: T[]; total_pages: number }>(`${url}&page=${page}`, DAY, {
      pick: (b) => ({ items: (b[field] || []).map(map), total_pages: b.total_pages || 1 }),
    });
    out.push(...body.items);
    if (page >= body.total_pages) break;
  }
  return out;
}

const tagNote = (t: PiTrack, name: string) => t.tags.find((g) => g.name === name)?.notes || "";
const mins = (ms: number) => (ms ? r1(ms / 60000) : null);

// ======================================================================
export async function buildAll() {
  const att = await attendance();
  const empty: PiShow = { ms: 0, tour: "", venue: "", lat: null, lon: null, location: "", audio: "missing", tracks: [] };
  const pi = await mapLimit(att, 4, (a) =>
    getJSON<PiShow>(`${PHISHIN}/shows/${a.date}`, ageFor(a.date), { pick: pickShow }).catch((e) => {
      console.warn(`[phashboard] phish.in ${a.date}: ${(e as Error).message}`);
      return empty;
    }),
  );
  const catalog = await pagesOf(`${PHISHIN}/songs?per_page=500`, "songs", (s: any) => ({ title: s.title as string, played: s.tracks_count as number, original: !!s.original, artist: (s.artist || "") as string, slug: s.slug as string }));
  const allShows = await pagesOf(`${PHISHIN}/shows?per_page=1000`, "shows", (s: any) => ({ date: s.date as string, venue: s.venue_name as string, location: (s.venue?.location || "") as string, tour: (s.tour_name || "") as string }));
  const cat = new Map(catalog.map((c) => [c.title, c]));

  // ---------- shows + tracks ----------
  type Stat = { seen: number; first: string | null; last: string | null; longest: number; longest_date: string | null; jc: number };
  const songStats = new Map<string, Stat>();
  const shows: any[] = [];
  const tracks: any[] = [];
  att.forEach((a, i) => {
    const v = pi[i];
    const audio = v.audio !== "missing" && v.ms > 0;
    const tr = v.tracks.filter((t) => t.set !== "Soundcheck").sort((x, y) => x.pos - y.pos);
    let songs = 0, fresh = 0, jc = 0, bo = 0, de = 0, te = 0, gu = 0, longest: [string, number] = ["", 0];
    const sets: string[] = [];
    for (const t of tr) {
      const tn = t.tags.map((g) => g.name);
      if (!sets.includes(t.set)) sets.push(t.set);
      jc += +tn.includes("Jamcharts"); bo += +tn.includes("Bustout"); de += +tn.includes("Debut"); gu += +tn.includes("Guest");
      te += tn.filter((x) => x === "Tease").length;
      const m = audio ? mins(t.ms) : null;
      if (m && m > longest[1]) longest = [t.title, m];
      let first = false;
      for (const s of t.songs) {
        songs++;
        const st = songStats.get(s.title) ?? { seen: 0, first: null, last: null, longest: 0, longest_date: null, jc: 0 };
        st.seen++; st.last = a.date;
        if (!st.first) { st.first = a.date; fresh++; first = true; }
        if (m && m > st.longest) { st.longest = m; st.longest_date = a.date; }
        if (tn.includes("Jamcharts")) st.jc++;
        songStats.set(s.title, st);
      }
      const gaps = t.songs.map((s) => s.gap).filter((g): g is number => g != null);
      tracks.push({
        key: `${a.date}#${t.pos}`, date: a.date, set: t.set, pos: t.pos, title: t.title, minutes: m,
        jamchart: tn.includes("Jamcharts"), bustout: tn.includes("Bustout"), debut: tn.includes("Debut"),
        gap: gaps.length ? Math.max(...gaps) : null, first_time: first,
        tags: Array.from(new Set(tn.filter((x) => !["SBD", "RMSTR", "CUT"].includes(x)))).sort().join(", "),
        note: (tagNote(t, "Jamcharts") || tagNote(t, "Bustout") || tagNote(t, "Debut") || tagNote(t, "Guest")).slice(0, 400),
      });
    }
    const s1 = tr.filter((t) => t.set === "Set 1");
    shows.push({
      date: a.date, n: i + 1, year: Number(a.date.slice(0, 4)), venue: (v.venue || a.venue).trim(), location: v.location || `${a.city}, ${a.state}`,
      state: a.state, country: a.country, tour: v.tour, lat: v.lat, lon: v.lon, minutes: audio ? mins(v.ms) : null,
      songs, new_songs: fresh, jamcharts: jc, bustouts: bo, debuts: de, teases: te, guests: gu,
      sets: sets.filter((x) => x.startsWith("Set")).length, opener: s1[0]?.title || "",
      encore: tr.filter((t) => t.set.startsWith("Encore")).map((t) => t.title).join(" / "),
      longest_song: longest[0], longest_min: longest[1] || null, audio,
      phishnet: `https://phish.net/setlists/?d=${a.date}`, phishin: `https://phish.in/${a.date}`, showid: a.showid,
    });
  });

  const songs = catalog.map((c) => {
    const st = songStats.get(c.title);
    return {
      song: c.title, seen: st?.seen ?? 0, played: c.played, original: c.original, artist: c.artist || (c.original ? "Phish" : ""),
      first_seen: st?.first ?? null, last_seen: st?.last ?? null, longest_min: st?.longest || null, longest_date: st?.longest_date ?? null,
      jamcharts_seen: st?.jc ?? 0, slug: c.slug, pseudo: PSEUDO.has(c.title),
    };
  });

  const byYear = new Map<number, { n: number; m: number }>();
  for (const s of shows) { const y = byYear.get(s.year) ?? { n: 0, m: 0 }; y.n++; y.m += s.minutes || 0; byYear.set(s.year, y); }
  const phishByYear = new Map<number, number>();
  for (const s of allShows) phishByYear.set(Number(s.date.slice(0, 4)), (phishByYear.get(Number(s.date.slice(0, 4))) || 0) + 1);
  const y0 = shows.length ? shows[0].year : new Date().getFullYear();
  const years = [];
  for (let y = y0; y <= new Date().getFullYear(); y++) years.push({ year: y, phish_shows: phishByYear.get(y) || 0, my_shows: byYear.get(y)?.n || 0, hours: r1((byYear.get(y)?.m || 0) / 60) });

  const vmap = new Map<string, any[]>();
  for (const s of shows) vmap.set(s.venue, [...(vmap.get(s.venue) || []), s]);
  const venues = Array.from(vmap.entries()).map(([venue, L]) => ({
    venue, location: L[0].location, lat: L[0].lat, lon: L[0].lon, shows: L.length, first: L[0].date, last: L[L.length - 1].date,
    years: new Set(L.map((x) => x.year)).size, hours: r1(L.reduce((t, x) => t + (x.minutes || 0), 0) / 60), jamcharts: L.reduce((t, x) => t + x.jamcharts, 0),
  })).sort((a, b) => b.shows - a.shows || a.first.localeCompare(b.first));

  const attendedDates = new Set(att.map((a) => a.date));
  const history = allShows.map((h) => ({ ...h, attended: attendedDates.has(h.date) }));

  const originals = catalog.filter((c) => c.original);
  const summary = {
    shows: shows.length, first_show: shows[0]?.date, latest_show: shows[shows.length - 1]?.date,
    years_span: shows.length ? shows[shows.length - 1].year - shows[0].year : 0, years_attended: byYear.size,
    hours: r1(shows.reduce((t, s) => t + (s.minutes || 0), 0) / 60), shows_with_audio: shows.filter((s) => s.audio).length,
    songs_heard: shows.reduce((t, s) => t + s.songs, 0), unique_songs: songStats.size, venues: venues.length,
    states: new Set(shows.map((s) => `${s.state}|${s.country}`)).size, countries: new Set(shows.map((s) => s.country)).size,
    jamcharts: shows.reduce((t, s) => t + s.jamcharts, 0), bustouts: shows.reduce((t, s) => t + s.bustouts, 0), debuts: shows.reduce((t, s) => t + s.debuts, 0),
    originals_total: originals.length, originals_seen: originals.filter((c) => songStats.has(c.title)).length, phish_shows_total: allShows.length,
  };

  const pf = await buildPhantasy(attendedDates);
  return { summary, shows, tracks, songs, years, venues, history, ...pf };
}

// ======================================================================
async function buildPhantasy(attended: Set<string>) {
  const scored: any[] = (await getJSON<any>(`${PF_BASE}/api/scored-shows`, HOUR)).shows || [];
  const tours: any[] = ((await getJSON<any>(`${PF_BASE}/api/tours`, 6 * HOUR)).tours || []).sort((a: any, b: any) => a.start_date.localeCompare(b.start_date));
  const mine: any[] = (await getJSON<any>(`${PF_BASE}/api/users/${PF_USER}/predictions`, HOUR)).predictions || [];
  const tourOf = (d: string) => tours.find((t) => t.start_date <= d && d <= t.end_date)?.name || "Other";
  scored.sort((a, b) => a.showdate.localeCompare(b.showdate));
  const lbs = await mapLimit(scored, 6, (s) =>
    getJSON<[number, string, number | null][]>(`${PF_BASE}/api/shows/${s.showid}/leaderboard`, ageFor(s.showdate), {
      pick: (b) => (b.leaderboard || []).map((e: any) => [e.userId, e.userName, e.score]),
    }),
  );
  const lb = new Map(scored.map((s, i) => [String(s.showid), lbs[i]]));
  const mineBy = new Map(mine.map((p) => [String(p.show_id), p]));
  const withPred = scored.filter((s) => mineBy.has(String(s.showid)));
  const actuals = await mapLimit(withPred, 6, (s) =>
    getJSON<any>(`${PF_BASE}/api/setlists/${s.showid}/structured`, ageFor(s.showdate)).catch(() => null),
  );
  const breakdowns = await mapLimit(withPred, 6, (s) => {
    const p = mineBy.get(String(s.showid));
    if (p.score == null) return Promise.resolve(null);
    return getJSON<any>(`${PF_BASE}/api/predictions/${p.id}/breakdown`, ageFor(s.showdate), { pick: (b) => b.breakdown || b }).catch(() => null);
  });
  const actualBy = new Map(withPred.map((s, i) => [String(s.showid), actuals[i]]));
  const bdBy = new Map(withPred.map((s, i) => [String(s.showid), breakdowns[i]]));

  const CATS: [string, string][] = [["correctSpecial", "special"], ["correctSong", "exact"], ["encoreInSet", "encore"], ["songInSet", "right_set"], ["songInShow", "in_show"], ["bustoutBonus", "bustout"]];
  const pfShows: any[] = [], picks: any[] = [], actualRows: any[] = [];
  for (const s of scored) {
    const sid = String(s.showid), d = s.showdate as string;
    const board = lb.get(sid) || [];
    const sc = board.map((e) => e[2]).filter((x): x is number => x != null);
    const me = board.find((e) => e[0] === PF_USER), wb = board.find((e) => e[0] === WOOKBOT);
    const humans = board.filter((e) => e[0] !== WOOKBOT && e[2] != null).map((e) => e[2] as number);
    const myScore = me?.[2] ?? null;
    const rank = myScore != null ? 1 + humans.filter((x) => x > myScore).length : null;
    const row: any = {
      date: d, showid: sid, venue: s.venue, location: s.location, tour: tourOf(d), attended: attended.has(d),
      my_score: myScore, wook_score: wb?.[2] ?? null, field_median: median(sc), field_max: sc.length ? Math.max(...sc) : null,
      players: humans.length, my_rank: rank, percentile: rank ? Math.round((1 - (rank - 1) / Math.max(1, humans.length - 1)) * 1000) / 1000 : null,
    };
    row.vs_wook = row.my_score == null || row.wook_score == null ? null : row.my_score > row.wook_score ? "win" : row.my_score < row.wook_score ? "loss" : "tie";
    const bd = bdBy.get(sid);
    const okBd = bd && !bd.__err && bd.details ? bd : null;
    for (const [c, n] of CATS) row[n] = okBd ? okBd[c]?.points ?? 0 : null;
    const act = actualBy.get(sid);
    const before = actualRows.length;
    if (act && !act.__err) {
      for (const k of ["set1", "set2", "encore"]) {
        (act[k] || []).forEach((it: any, i: number) => {
          const nm = it.name || it.song?.name;
          if (nm) actualRows.push({ key: `${d}#${SET_LABEL[k]}#${i + 1}`, date: d, set: SET_LABEL[k], pos: i + 1, song: nm, you_picked: false });
        });
      }
    }
    if (okBd) {
      let pk = 0, hit = 0;
      for (const x of okBd.details) {
        if (!x.predictedSet) continue;
        pk++; if (x.points > 0) hit++;
        picks.push({
          key: `${d}#${SET_LABEL[x.predictedSet] || x.predictedSet}#${x.predictedPosition}`, date: d, set: SET_LABEL[x.predictedSet] || x.predictedSet,
          pos: x.predictedPosition, song: x.songName, points: x.points, outcome: x.reason,
          played_set: SET_LABEL[x.actualSet] ?? null, played_pos: x.actualPosition ?? null,
        });
      }
      row.picks = pk; row.hits = hit; row.songs_played = actualRows.length - before;
    } else { row.picks = row.hits = row.songs_played = null; }
    pfShows.push(row);
  }
  const pickSet = new Map<string, Set<string>>();
  for (const p of picks) { if (!pickSet.has(p.date)) pickSet.set(p.date, new Set()); pickSet.get(p.date)!.add(p.song.toLowerCase()); }
  for (const r of actualRows) r.you_picked = !!pickSet.get(r.date)?.has(r.song.toLowerCase());

  // blind spots
  const playedDates = new Set(actualRows.map((r) => r.date));
  const sp = new Map<string, Set<string>>(), pl = new Map<string, Set<string>>(), names = new Map<string, string>(), pts = new Map<string, number>();
  for (const p of picks) { const k = p.song.toLowerCase(); if (!sp.has(k)) sp.set(k, new Set()); sp.get(k)!.add(p.date); if (!names.has(k)) names.set(k, p.song); pts.set(k, (pts.get(k) || 0) + p.points); }
  for (const r of actualRows) { const k = r.song.toLowerCase(); if (!pl.has(k)) pl.set(k, new Set()); pl.get(k)!.add(r.date); if (!names.has(k)) names.set(k, r.song); }
  const N = Math.max(1, playedDates.size);
  const bias: any[] = [];
  for (const k of Array.from(new Set(Array.from(sp.keys()).concat(Array.from(pl.keys()))))) {
    const a = sp.get(k)?.size || 0, b = pl.get(k)?.size || 0;
    if (a + b < 3) continue;
    const both = Array.from(sp.get(k) || new Set<string>()).filter((d) => pl.get(k)?.has(d)).length;
    bias.push({ song: names.get(k), picked: a, played: b, both, pick_rate: Math.round((a / N) * 1000) / 1000, play_rate: Math.round((b / N) * 1000) / 1000, points: pts.get(k) || 0, diff: a - b });
  }

  // tour race + standings
  const race: any[] = [];
  for (const t of tours) {
    const totals = new Map<number, number>(), nm = new Map<number, string>();
    for (const r of pfShows.filter((x) => x.tour === t.name)) {
      for (const [u, name, score] of lb.get(r.showid) || []) if (score != null) { totals.set(u, (totals.get(u) || 0) + score); nm.set(u, name); }
      Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).forEach(([u, v], i) =>
        race.push({ key: `${t.name}#${r.date}#${u}`, tour: t.name, date: r.date, user: nm.get(u), user_id: u, total: v, rank: i + 1, is_me: u === PF_USER, is_bot: u === WOOKBOT }));
    }
  }
  const tot = new Map<number, number>(), gp = new Map<number, number>(), unames = new Map<number, string>();
  for (const r of pfShows) for (const [u, name, score] of lb.get(r.showid) || []) if (score != null) { tot.set(u, (tot.get(u) || 0) + score); gp.set(u, (gp.get(u) || 0) + 1); unames.set(u, name); }
  const standings = Array.from(tot.entries()).sort((a, b) => b[1] - a[1]).map(([u, v], i) => ({ rank: i + 1, user: unames.get(u), user_id: u, total: v, games: gp.get(u) || 0, avg: r1(v / (gp.get(u) || 1)), is_me: u === PF_USER, is_bot: u === WOOKBOT }));

  const games = pfShows.filter((r) => r.my_score != null);
  const best = games.reduce((b, r) => (!b || r.my_score > b.my_score ? r : b), null as any);
  const att = games.filter((r) => r.attended).map((r) => r.my_score), away = games.filter((r) => !r.attended).map((r) => r.my_score);
  const pcts = games.map((r) => r.percentile).filter((x) => x != null);
  const meSt = standings.find((s) => s.is_me), wbSt = standings.find((s) => s.is_bot);
  const pickTotal = games.reduce((t, r) => t + (r.picks || 0), 0);
  const pf_summary = games.length ? {
    games: games.length, total: games.reduce((t, r) => t + r.my_score, 0), avg: r1(mean(games.map((r) => r.my_score))!),
    best: best.my_score, best_date: best.date, best_venue: best.venue, worst: Math.min(...games.map((r) => r.my_score)),
    overall_rank: meSt?.rank ?? null, players: standings.length, wook_rank: wbSt?.rank ?? null,
    wins: games.filter((r) => r.vs_wook === "win").length, losses: games.filter((r) => r.vs_wook === "loss").length, ties: games.filter((r) => r.vs_wook === "tie").length,
    attended_games: att.length, attended_avg: att.length ? r1(mean(att)!) : null, away_avg: away.length ? r1(mean(away)!) : null,
    median_pct: median(pcts), hit_rate: pickTotal ? Math.round((games.reduce((t, r) => t + (r.hits || 0), 0) / pickTotal) * 1000) / 1000 : null,
    top_finishes: games.filter((r) => r.my_rank === 1).length, top10: games.filter((r) => r.my_rank && r.my_rank <= 10).length,
  } : null;

  return { pf_summary, pf_shows: pfShows, pf_picks: picks, pf_actual: actualRows, pf_bias: bias, pf_race: race, pf_standings: standings };
}
