// A tinyradar you can put on the page: the cabinet's round screen with its
// 8-LED light ring, running the firmware's own ring effects (ring.ts).
// The screen is either the scope (a made-up sky, drawn on a canvas) or one of
// the status screens (RoundScreen). It animates only while it's on screen and
// motion is on (motion.ts); otherwise it shows one still frame.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  FX,
  N,
  PALS,
  RING_DEFAULT,
  SCOPE_LOOK,
  STILL_T,
  blipsFor,
  drawScope,
  onTick,
  renderRing,
  type Look,
  type RingState,
  type SkyOpts,
} from "./ring";
import { useMotion, useOnScreen } from "./motion";
import { SCREEN_LABEL, screenBody, type ScreenKind } from "./RoundScreen";

export interface RingDeviceProps {
  /** Screen diameter in px; the cabinet is 1.36 × that. */
  size?: number;
  /** No cabinet face and lime ring: just the screen and the LEDs. */
  bare?: boolean;
  /** No LEDs at all. */
  noRing?: boolean;
  screen?: "scope" | ScreenKind;
  look?: Look;
  sky?: SkyOpts;
  ring?: Partial<RingState>;
  /** Where LED 0 physically sits, in 45° steps (the "Line it up" puzzle). */
  phys?: number;
  /** The board's status light, pulsing (setup). */
  status?: boolean;
  /** Freeze at this moment, whatever motion says. */
  still?: number;
  /** Seconds added to the clock, so devices side by side don't move in step. */
  tOff?: number;
  label?: string;
  className?: string;
}

export function RingDevice({
  size = 200,
  bare = false,
  noRing = false,
  screen = "scope",
  look = SCOPE_LOOK,
  sky = {},
  ring,
  phys = 0,
  status = false,
  still,
  tOff = 0,
  label,
  className,
}: RingDeviceProps) {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const leds = useRef<(HTMLElement | null)[]>([]);
  const [motion] = useMotion();
  const vis = useOnScreen(root);

  const g: RingState = { ...RING_DEFAULT, ...ring };
  const skyKey = JSON.stringify(sky);
  const blips = useMemo(() => blipsFor(sky), [skyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // latest props for the frame callback
  const st = useRef({ g, look, screen, size, blips, tOff, noRing, sky });
  st.current = { g, look, screen, size, blips, tOff, noRing, sky };
  const out = useRef<[number, number, number][]>([]);
  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;

  const frame = (T: number) => {
    const s = st.current;
    const t = T + s.tOff;
    const scopeLike = s.screen === "scope" || s.screen === "nolocation";
    const ringOn = scopeLike && !s.noRing;
    renderRing(
      { ...s.g, on: ringOn ? s.g.on : 0, fx: FX.indexOf(s.g.fx), c: PALS[s.g.pal] },
      t,
      s.blips,
      out.current,
    );
    const gain = 0.45 + 0.55 * s.g.bri;
    leds.current.forEach((l, i) => {
      if (!l) return;
      const [r, gg, b] = out.current[i] ?? [0, 0, 0];
      const m = Math.max(r, gg, b);
      if (m < 6) {
        l.style.background = "";
        l.style.boxShadow = "";
        return;
      }
      const k = (Math.pow(m / 255, 0.55) * 255 * gain) / m;
      const rr = Math.round(r * k),
        g2 = Math.round(gg * k),
        bb = Math.round(b * k);
      const a = Math.min(1, (m / 255) * gain * 1.3);
      l.style.background = `rgb(${rr},${g2},${bb})`;
      l.style.boxShadow = `0 0 ${s.size * 0.05}px ${s.size * 0.015}px rgba(${rr},${g2},${bb},${a}),0 0 ${s.size * 0.14}px ${s.size * 0.04}px rgba(${rr},${g2},${bb},${a * 0.45})`;
    });
    if (scopeLike && cv.current) drawScope(cv.current, dpr, s.look, t, s.screen === "scope" ? s.blips : [], s.sky);
  };

  // canvas size
  useLayoutEffect(() => {
    if (!cv.current) return;
    cv.current.width = cv.current.height = Math.round(size * dpr);
  }, [size, dpr, screen]);

  const animate = motion && vis && still === undefined;
  useEffect(() => {
    if (animate) return onTick(frame);
    frame(still ?? STILL_T);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, still, size, screen, skyKey, look, g.fx, g.pal, g.bri, g.spd, g.alerts, g.rot, g.ccw, g.on, noRing]);

  const R = size * 0.6;
  const aria =
    label ??
    (screen === "scope"
      ? `A tinyradar: the round screen with planes${noRing ? "" : `, the light ring on ${g.fx}`}`
      : `A tinyradar, its round screen showing ${SCREEN_LABEL[screen]}`);

  return (
    <div
      ref={root}
      className={cn("trd", bare && "bare", className)}
      style={{ ["--s" as string]: `${size}px` }}
      {...(label === "" ? { "aria-hidden": true } : { role: "img", "aria-label": aria })}
    >
      <div className="trd-face" />
      <div className="trd-lime" />
      <div className="trd-scr">
        {screen === "scope" || screen === "nolocation" ? <canvas ref={cv} /> : null}
        {screen === "scope" ? null : screenBody(screen)}
      </div>
      {noRing
        ? null
        : Array.from({ length: N }, (_, i) => {
            const deg = ((phys + i) * 45 + 720) % 360;
            const a = (deg * Math.PI) / 180;
            return (
              <i
                key={i}
                ref={(el) => {
                  leds.current[i] = el;
                }}
                className="trd-led"
                style={{ transform: `translate(${R * Math.sin(a)}px,${-R * Math.cos(a)}px)` }}
              />
            );
          })}
      {status ? <i className="trd-status" /> : null}
    </div>
  );
}

/** A plain scope with no cabinet and no ring: for looks and range strips. */
export function Scope({
  size = 120,
  look,
  sky,
  className,
  label,
}: {
  size?: number;
  look?: Look;
  sky?: SkyOpts;
  className?: string;
  label: string;
}) {
  return <RingDevice size={size} bare noRing look={look} sky={sky} className={cn("trd-plain", className)} label={label} />;
}
