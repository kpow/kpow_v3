// Devlog ledger — one row per entry on the purple spine (date · title · tags ·
// tiny thumbs), grouped under month markers. A row opens in place to the full
// body and a photo mosaic. Ported from Option A in docs/comps/buildlog-density/.
//
// Rows are <details>, kept in step with React state through onToggle so
// "Expand all" and deep links (#e-…) can open them. A body is only rendered
// while its row is open: /builds/recently has 139 of them.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { BuildEntry, BuildMedia } from "@/lib/buildlog";
import { isVideo, MediaTile, still, type Shot } from "./Lightbox";
import { Markdown } from "./Markdown";

/** A build's own entry, optionally carrying the build it came from (the
 *  cross-build /builds/recently feed attributes each entry). */
type Entry = BuildEntry & { build?: string; buildTitle?: string };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-14" -> "Oct 14"; the month marker above carries the year. */
function rowDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  if (!m || !d) return iso;
  return `${MONTHS[m - 1].slice(0, 3)} ${String(d).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : key;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "2 photos · 1 video · 2 min read" */
function rowMeta(entry: Entry) {
  const videos = entry.media.filter((m) => isVideo(m.src)).length;
  const photos = entry.media.length - videos;
  const words = (entry.body.match(/\S+/g) || []).length;
  return [
    photos && plural(photos, "photo"),
    videos && plural(videos, "video"),
    `${Math.max(1, Math.round(words / 220))} min read`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** A stable anchor per entry: e-[build-]date-title, de-duplicated. The build
 *  prefix comes from the entry, so a link survives the recently filter. */
function entryIds(entries: Entry[]) {
  const seen = new Set<string>();
  return entries.map((e) => {
    const title = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const base = `e-${e.build ? `${e.build}-` : ""}${e.date}-${title}`;
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return id;
  });
}

function Mini({ shot, more }: { shot: BuildMedia; more?: number }) {
  return (
    <span className="mini">
      <img src={still(shot)} alt="" loading="lazy" />
      {isVideo(shot.src) && <span className="mini-play" />}
      {!!more && <span className="mini-more">+{more}</span>}
    </span>
  );
}

/** Up to three thumbs on a wide screen, one on a phone, "+N" for the rest. */
function Thumbs({ media }: { media: BuildMedia[] }) {
  return (
    <>
      <span className="r-thumbs desk" aria-hidden="true">
        {media.slice(0, 3).map((m, i) => (
          <Mini shot={m} more={i === 2 ? media.length - 3 : 0} key={m.src} />
        ))}
      </span>
      <span className="r-thumbs phone" aria-hidden="true">
        {media[0] && <Mini shot={media[0]} more={media.length - 1} />}
      </span>
    </>
  );
}

/** 1 = wide, 2 = side by side, 3+ = a lead and two, "+N more" on the last.
 *  Every tile opens the lightbox on the whole entry. */
function Mosaic({ entry }: { entry: Entry }) {
  const n = entry.media.length;
  const gallery: Shot[] = entry.media.map((m, i) => ({
    ...m,
    alt: n > 1 ? `${entry.title} (${i + 1} of ${n})` : entry.title,
  }));

  return (
    <>
      <div className={`mosaic n${Math.min(n, 3)}`}>
        {gallery.slice(0, 3).map((shot, i) => {
          const more = i === 2 && n > 3 ? n - 3 : 0;
          return (
            <MediaTile gallery={gallery} index={i} num={n > 1 && !more ? String(i + 1) : undefined} key={shot.src}>
              {!!more && (
                <span className="more">
                  <span>
                    +{more}
                    <small>more</small>
                  </span>
                </span>
              )}
            </MediaTile>
          );
        })}
      </div>
      {entry.media.some((m) => m.caption) && (
        <ul className="caps">
          {entry.media.map(
            (m, i) =>
              m.caption && (
                <li key={m.src}>
                  <span className="k">{n > 1 ? i + 1 : "◆"}</span>
                  <span>{m.caption}</span>
                </li>
              ),
          )}
        </ul>
      )}
    </>
  );
}

export function Ledger({
  entries,
  showBuild = false,
  openFirst = false,
}: {
  entries: Entry[];
  /** Label each row with its build (the cross-build feed). */
  showBuild?: boolean;
  /** Start with the newest entry open. */
  openFirst?: boolean;
}) {
  const ids = useMemo(() => entryIds(entries), [entries]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(openFirst && ids[0] ? [ids[0]] : []));
  const [flash, setFlash] = useState<string | null>(null);

  const setRow = useCallback((id: string, isOpen: boolean) => {
    setOpen((prev) => {
      if (prev.has(id) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // #e-… opens that entry and brings it into view
  useEffect(() => {
    let timer: number | undefined;
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!ids.includes(id)) return;
      setRow(id, true);
      setFlash(id);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setFlash(null), 1500);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.clearTimeout(timer);
    };
  }, [ids, setRow]);

  // group into months, keeping the newest-first order
  const months: { key: string; rows: { entry: Entry; id: string }[] }[] = [];
  entries.forEach((entry, i) => {
    const key = entry.date.slice(0, 7);
    if (months[months.length - 1]?.key !== key) months.push({ key, rows: [] });
    months[months.length - 1].rows.push({ entry, id: ids[i] });
  });

  return (
    <>
      <div className="dl-bar">
        <div className="seg" role="group" aria-label="Expand or collapse entries">
          <button type="button" onClick={() => setOpen(new Set(ids))}>
            Expand all
          </button>
          <button type="button" onClick={() => setOpen(new Set())}>
            Collapse all
          </button>
        </div>
        <span className="hint">{plural(entries.length, "entry", "entries")} · tap a row to open it</span>
      </div>

      <section className="ledger">
        {months.map((month) => (
          <div className="lmonth-group" key={month.key}>
            <div className="lmonth">
              <h3>{monthLabel(month.key)}</h3>
              <span className="n">{plural(month.rows.length, "entry", "entries")}</span>
              <span className="rule" />
            </div>
            {month.rows.map(({ entry, id }) => {
              const isOpen = open.has(id);
              return (
                <details
                  className={`lrow${entry.media.length ? "" : " text-only"}${flash === id ? " flash" : ""}`}
                  id={id}
                  key={id}
                  open={isOpen}
                  onToggle={(e) => setRow(id, e.currentTarget.open)}
                >
                  <summary>
                    <span className="r-date">{rowDate(entry.date)}</span>
                    <span className="r-main">
                      {showBuild && entry.build && <span className="r-from">{entry.buildTitle}</span>}
                      <span className="r-title">{entry.title}</span>
                      {!!entry.tags?.length && (
                        <span className="r-tags">
                          {entry.tags.map((tag) => (
                            <span className="entry-tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <Thumbs media={entry.media} />
                    <span className="r-chev" aria-hidden="true" />
                  </summary>
                  {isOpen && (
                    <div className="r-body">
                      <div className="entry-body">
                        <Markdown>{entry.body || ""}</Markdown>
                      </div>
                      {!!entry.media.length && <Mosaic entry={entry} />}
                      <div className="r-foot">
                        <span>{rowMeta(entry)}</span>
                        {showBuild && entry.build && <Link href={`/builds/${entry.build}`}>{entry.buildTitle} →</Link>}
                        <a href={`#${id}`}>link</a>
                        <button
                          type="button"
                          onClick={(e) => {
                            const row = e.currentTarget.closest("details");
                            setRow(id, false);
                            row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                          }}
                        >
                          collapse ↑
                        </button>
                      </div>
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        ))}
      </section>
    </>
  );
}
