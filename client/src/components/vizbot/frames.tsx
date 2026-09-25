// CSS-only device frames around real 2x screenshots. Size them with the --sw
// custom property (the screen's on-page width), e.g. className="[--sw:176px]
// md:[--sw:200px]", so one frame can change size at a breakpoint.

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Back plates along the dome. The shell's top corners are ellipses (the
// border-radius 46%/32% of a 1.18sw × 1.47sw box); each plate sits on that
// curve, turned to its outward normal. Angles are from straight up.
const W = 1.18;
const H = 1.47;
const RX = 0.46 * W;
const RY = 0.32 * H;
const PLATES = [-68, -45, -22, 0, 22, 45, 68].map((deg) => {
  const a = (Math.abs(deg) * Math.PI) / 180;
  const side = Math.sign(deg);
  const cx = side < 0 ? RX : side > 0 ? W - RX : W / 2;
  const x = cx + side * RX * Math.sin(a);
  const y = RY - RY * Math.cos(a);
  // outward normal of the ellipse (screen coords, y down) -> CSS rotation
  const rot = (Math.atan2(side * (Math.sin(a) / RX), Math.cos(a) / RY) * 180) / Math.PI;
  return {
    left: `${((x / W) * 100).toFixed(2)}%`,
    top: `${((y / H) * 100).toFixed(2)}%`,
    "--rot": `${rot.toFixed(1)}deg`,
    "--k": (1 - Math.abs(deg) / 150).toFixed(3),
  } as CSSProperties;
});

export function DinoFrame({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  /** above the fold: skip lazy loading */
  eager?: boolean;
}) {
  return (
    <div className={cn("vb-dino", className)}>
      {PLATES.map((style, i) => (
        <span key={i} className="vb-dino-plate" style={style} aria-hidden="true" />
      ))}
      <span className="vb-dino-tail" aria-hidden="true" />
      <span className="vb-dino-foot l" aria-hidden="true" />
      <span className="vb-dino-foot r" aria-hidden="true" />
      <div className="vb-dino-shell">
        <div className="vb-dino-bezel">
          <img src={src} alt={alt} width={240} height={280} loading={eager ? "eager" : "lazy"} decoding="async" className="vb-shot" />
        </div>
      </div>
    </div>
  );
}

const LEDS = ["#FF5A5F", "#FF9A3C", "#FFD23F", "#3DDC84", "#3FD8FF", "#B967FF"];

export function LandscapeFrame({
  src,
  alt,
  base = false,
  className,
}: {
  src: string;
  alt: string;
  /** Stand it on the Stackchan robot base with its LED ring. */
  base?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("vb-land", className)}>
      <div className="vb-land-body">
        <img src={src} alt={alt} width={320} height={240} loading="lazy" decoding="async" className="vb-shot" />
      </div>
      {base && (
        <>
          <div className="vb-land-neck" aria-hidden="true" />
          <div className="vb-land-base" aria-hidden="true">
            {[...LEDS, ...LEDS].map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
