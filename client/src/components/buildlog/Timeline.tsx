// Devlog timeline — purple spine with a node per entry. Entries that carry media
// show the photo; text-only entries show no image slot (the mix is intentional).

import { Link } from "wouter";
import type { BuildEntry } from "@/lib/buildlog";
import { Zoomable } from "./Lightbox";
import { Markdown } from "./Markdown";

/** A build's own entry, optionally carrying the build it came from (the
 *  cross-build /builds/recently feed attributes each entry). */
type Entry = BuildEntry & { build?: string; buildTitle?: string };

export function Timeline({ entries }: { entries: Entry[] }) {
  return (
    <section className="timeline">
      {entries.map((entry, i) => (
        <article className="entry" key={`${entry.date}-${entry.title}-${i}`}>
          <div className="entry-date">
            {entry.date}
            {entry.build && (
              <>
                {" · "}
                <Link href={`/builds/${entry.build}`} className="from">
                  {entry.buildTitle}
                </Link>
              </>
            )}
          </div>
          <h3 className="entry-title">{entry.title}</h3>
          {!!entry.tags?.length && (
            <div className="entry-tags">
              {entry.tags.map((tag) => (
                <span className="entry-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="entry-body">
            <Markdown>{entry.body || ""}</Markdown>
          </div>
          {entry.media?.map((shot) => (
            <figure className="entry-fig" key={shot.src}>
              <Zoomable src={shot.src} poster={shot.poster} caption={shot.caption} />
              {shot.caption && <figcaption>{shot.caption}</figcaption>}
            </figure>
          ))}
        </article>
      ))}
    </section>
  );
}
