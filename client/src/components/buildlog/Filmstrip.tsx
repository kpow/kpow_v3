// WIP Pix — a contact sheet of the dated, media-bearing entries, oldest first.
// Scrolls horizontally when it overflows.

import type { Build } from "@/lib/buildlog";
import { Zoomable } from "./Lightbox";

export function Filmstrip({ shots }: { shots: Build["picturesOverTime"] }) {
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
            <Zoomable src={shot.src} poster={shot.poster} caption={shot.caption} />
            <figcaption className="frame-meta">
              <div className="frame-date">{shot.date}</div>
              <div className="frame-cap">{shot.caption}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
