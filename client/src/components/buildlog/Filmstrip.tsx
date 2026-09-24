// WIP Pix — a contact sheet of the dated, media-bearing entries. A thumbnail
// grid capped at PAGE shots, with a "more" button and a newest/oldest sort.

import { useState } from "react";
import type { Build } from "@/lib/buildlog";
import { Zoomable } from "./Lightbox";

const PAGE = 12;

type Order = "newest" | "oldest";

export function Filmstrip({ shots, buildTitle }: { shots: Build["picturesOverTime"]; buildTitle: string }) {
  const [order, setOrder] = useState<Order>("newest");
  const [shown, setShown] = useState(PAGE);
  if (!shots.length) return null;

  // picturesOverTime arrives oldest first
  const sorted = order === "oldest" ? shots : [...shots].reverse();
  const visible = sorted.slice(0, shown);
  const left = sorted.length - visible.length;

  return (
    <section className="wippix">
      <div className="wippix-head">
        <h3>WIP Pix</h3>
        <span className="n">
          {shots.length} shot{shots.length === 1 ? "" : "s"} over time
        </span>
        {shots.length > 1 && (
          <div className="wippix-sort" role="group" aria-label="Sort photos">
            {(["newest", "oldest"] as const).map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={order === o}
                className={order === o ? "on" : undefined}
                onClick={() => setOrder(o)}
              >
                {o === "newest" ? "Newest" : "Oldest"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="filmstrip">
        {visible.map((shot) => (
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
      {left > 0 && (
        <button type="button" className="wippix-more" onClick={() => setShown(shown + PAGE)}>
          Show {Math.min(left, PAGE)} more <span className="n">· {left} left</span>
        </button>
      )}
    </section>
  );
}
