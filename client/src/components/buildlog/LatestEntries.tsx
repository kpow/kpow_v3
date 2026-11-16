import { Link } from "wouter";
import type { Build, RecentEntry } from "@/lib/buildlog";
import { shortDateNoYear } from "@/lib/buildlog";

const VIDEO = /\.(mp4|mov|webm)$/i;

/** First readable paragraph of the entry, markdown stripped, trimmed to ~190 chars. */
function synopsis(body: string): string {
  const para =
    body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !/^(#|!\[|<|```|[-*>|])/.test(p)) ?? "";
  const text = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 190) return text;
  return text.slice(0, 190).replace(/\s+\S*$/, "") + "…";
}

/** The entry's own first still; else the build's hero (flagged as a build photo). */
function photo(entry: RecentEntry, build?: Build): { src: string | null; fallback: boolean } {
  for (const m of entry.media) {
    const src = VIDEO.test(m.src) ? m.poster : m.src;
    if (src) return { src, fallback: false };
  }
  return { src: build?.hero ?? null, fallback: !!build?.hero };
}

/** Newest entry per build, newest first, capped at `limit`. */
export function latestPerBuild(recent: RecentEntry[], limit = 4): RecentEntry[] {
  const seen = new Set<string>();
  const out: RecentEntry[] = [];
  for (const e of recent) {
    if (seen.has(e.build)) continue;
    seen.add(e.build);
    out.push(e);
    if (out.length === limit) break;
  }
  return out;
}

/** "On the bench now": the newest entry as a photo lead, the next three as thumb rows.
 *  Each links to the build's page, not the entry. */
export function LatestEntries({ recent, builds }: { recent: RecentEntry[]; builds: Build[] }) {
  const items = latestPerBuild(recent);
  if (!items.length) return null;
  const [lead, ...rest] = items;
  const byslug = (s: string) => builds.find((b) => b.slug === s);
  const leadPhoto = photo(lead, byslug(lead.build));

  return (
    <div className="lead-wrap">
      <Link href={`/builds/${lead.build}`} className="lead">
        {leadPhoto.src && <img src={leadPhoto.src} alt="" />}
        <div className="lead-txt">
          <div className="kick">
            <b>newest</b>
            <span>{lead.buildTitle}</span>
            <span>{shortDateNoYear(lead.date)}</span>
          </div>
          <h3>{lead.title}</h3>
          <p>{synopsis(lead.body)}</p>
          <span className="go">Open {lead.buildTitle} →</span>
        </div>
      </Link>
      <div className="side">
        {rest.map((e) => {
          const p = photo(e, byslug(e.build));
          return (
            <Link href={`/builds/${e.build}`} className="row" key={e.build}>
              <div className="th">
                {p.src && <img src={p.src} alt="" loading="lazy" />}
                {p.fallback && <span className="fb">build photo</span>}
              </div>
              <div>
                <div className="m">
                  <b>{e.buildTitle}</b>
                  <span>{shortDateNoYear(e.date)}</span>
                </div>
                <h3>{e.title}</h3>
                <p>{synopsis(e.body)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
