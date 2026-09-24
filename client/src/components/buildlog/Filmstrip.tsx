// WIP Pix — a contact sheet of the dated, media-bearing entries, oldest first.
// Scrolls horizontally when it overflows.

import type { Build } from "@/lib/buildlog";
import { Zoomable } from "./Lightbox";

export function Filmstrip({ shots, buildTitle }: { shots: Build["picturesOverTime"]; buildTitle: string }) {
  if (!shots.length) return null;

  return (
    <section className="wippix">
      <div className="wippix-head">
        <h3>WIP Pix</h3>
        <span className="n">
          {shots.length} shot{shots.length === 1 ? "" : "s"} over time
        </span>
      </div>
      <div className="filmstrip">
        {shots.map((shot) => (
          <figure className="frame" key={`${shot.date}-${shot.src}`}>
            <Zoomable
              src={shot.src}
              alt={`${buildTitle} — ${shot.date}`}
              poster={shot.poster}
              caption={shot.caption}
              kind={shot.kind}
            />
            <figcaption className="frame-meta">
              <div className="frame-date">{shot.date}</div>
              {shot.caption && <div className="frame-cap">{shot.caption}</div>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
