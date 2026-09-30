// The viz family at the top of the homepage: one featured app in a big tile, the
// rest beside it (compact rows on a phone). Design: docs/comps/home-viz/option-b.html.
//
// To feature a different app, change FEATURED below. Nothing else needs to move:
// every app carries both its big-tile copy (`pitch`, `facts`) and its small-tile
// copy (`line`). The NEW flag shows only on the featured tile, and only when that
// app has `isNew: true`; set it to false once an app isn't new any more.
//
// Copy comes from each app's own page (/vizbot, /vizspot/guide, /vizmac and
// content/vizmac.ts). Keep it in step when those pages change.
// Photos and the vizBot clip are copies from the build log, in
// client/public/images/home-viz/. They're committed here, not linked from
// /buildlog/, so a rename in the content repo can't break the homepage.
//
// An app with `video` plays it in the big tile (muted loop, paused off screen,
// poster only under reduced motion). On a phone the clip sits above the text
// instead of behind it, so the 16:9 frame isn't cropped.

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import SectionHeader from "@/components/global/SectionHeader";

type VizId = "vizmac" | "vizbot" | "vizspot";

/** The app in the big tile. vizBot, for the fleet-on-a-WLED-sign clip. */
const FEATURED: VizId = "vizbot";

interface VizApp {
  id: VizId;
  name: string;
  /** Mono label: the chip on a tile, the line above the name in a phone row */
  eyebrow: string;
  /** One short line for the small tile */
  line: string;
  /** Two or three lines for the big tile */
  pitch: string;
  /** Stat chips on the big tile */
  facts: string[];
  cta: string;
  href: string;
  /** "how it got built" on the big tile */
  buildHref: string;
  isNew: boolean;
  img: { src: string; alt: string; width: number; height: number };
  /** A 16:9 clip for the big tile. `img` is still used on the small tile. */
  video?: { src: string; poster: string; label: string };
  /** object-position classes, per tile shape. Literal strings so Tailwind sees them. */
  pos: { feature: string; tile: string };
  /** Accent classes: the chip dot and the button (fill, text, hover) */
  dot: string;
  btn: string;
}

const IMG = "/images/home-viz";

// Listed in the order the small tiles appear. The featured app is lifted out.
const VIZ_APPS: VizApp[] = [
  {
    id: "vizmac",
    name: "vizMac",
    eyebrow: "desk macropad · macOS",
    line: "One knob for the whole desk: key lighting, music, a focus timer and WLED.",
    pitch:
      "One knob next to the keyboard runs the per-key lighting, Spotify or Music, a focus timer and your WLED lights.",
    facts: ["25 effects", "23 palettes", "4 modes"],
    cta: "SPIN IT",
    href: "/vizmac",
    buildHref: "/builds/vizmac",
    isNew: true,
    img: {
      src: `${IMG}/vizmac-now-playing.jpg`,
      alt: "The vizMac controller beside a lit keyboard, showing Now Playing with an EQ on its LEDs",
      width: 1200,
      height: 900,
    },
    pos: {
      feature: "object-[74%_50%] sm:object-center",
      tile: "object-[74%_50%] md:object-center",
    },
    dot: "bg-[#7AA2FF]",
    btn: "bg-[#7AA2FF] text-[#0a0a0a] group-hover:bg-[#9AB8FF]",
  },
  {
    id: "vizbot",
    name: "vizBot",
    eyebrow: "tiny desk robot",
    line: "An ESP32 screen with a face. Poke it and it pokes back.",
    pitch:
      "Firmware that gives a little ESP32 screen a face. Poke it and it pokes back. A desk full of them find each other over ESP-NOW and say their piece on a WLED sign.",
    facts: ["25 expressions", "16 scenes", "talks to WLED"],
    cta: "SAY HI",
    href: "/vizbot",
    buildHref: "/builds/vizbot",
    isNew: false,
    img: {
      src: `${IMG}/vizbot-desk.jpg`,
      alt: "vizBot in its lime-green case on a desk, a hologram vizBot beside it",
      width: 1000,
      height: 750,
    },
    video: {
      src: `${IMG}/vizbot-fleet.mp4`,
      poster: `${IMG}/vizbot-fleet.jpg`,
      label: "A desk of vizBots, their words scrolling across a WLED sign above them",
    },
    pos: {
      feature: "object-[48%_50%] sm:object-[48%_80%]",
      tile: "object-[48%_50%] md:object-[48%_95%]",
    },
    dot: "bg-[#FFD23F]",
    btn: "bg-[#FFD23F] text-[#0a0a0a] group-hover:bg-[#FFDB66]",
  },
  {
    id: "vizspot",
    name: "vizSpot",
    eyebrow: "spotify on a led panel",
    line: "The cover of what's playing on Spotify, in 64×64 LEDs.",
    pitch:
      "A 64×64 LED board that shows the cover of what's playing on Spotify and dances to the music. When nothing's on, it drifts into ambient patterns.",
    facts: ["64×64 panel", "22 effects", "23 palettes"],
    cta: "TUNE IN",
    href: "/vizspot/guide",
    buildHref: "/builds/vizspot",
    isNew: false,
    img: {
      src: `${IMG}/vizspot-cover.jpg`,
      alt: "vizSpot showing De La Soul's album cover on its 64 by 64 LED panel",
      width: 1000,
      height: 917,
    },
    pos: { feature: "object-[45%_42%]", tile: "object-[45%_42%]" },
    dot: "bg-green-500",
    btn: "bg-green-600 text-white group-hover:bg-green-700",
  },
];

const chipCls =
  "rounded bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The big tile's clip. Plays muted while on screen; the button pauses it for good. */
function TileVideo({ video, className }: { video: NonNullable<VizApp["video"]>; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(prefersReducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (paused) {
      el.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [paused]);

  return (
    <>
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        aria-label={video.label}
        muted
        loop
        playsInline
        preload="metadata"
        className={className}
      />
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play video" : "Pause video"}
        className={`absolute right-3 top-3 z-10 md:right-4 md:top-4 ${chipCls} hover:bg-black/85`}
      >
        {paused ? "▶ play" : "❚❚ pause"}
      </button>
    </>
  );
}

/**
 * The big tile: 2x2 on desktop. A div with a full-tile link, so it can hold the build log link too.
 * With a video, a phone gets the clip on top and the text below it rather than over it.
 */
function FeatureTile({ app }: { app: VizApp }) {
  const v = app.video;
  const mediaCls = `h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
    v ? "object-top" : `absolute inset-0 ${app.pos.feature}`
  }`;

  return (
    <div
      className={`group relative overflow-hidden rounded-lg bg-[#0e1014] sm:aspect-[16/10] md:col-span-2 lg:row-span-2 lg:aspect-auto ${
        v ? "flex flex-col sm:block" : "aspect-[4/5]"
      }`}
    >
      {v ? (
        <div className="relative aspect-video overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto">
          <TileVideo video={v} className={mediaCls} />
        </div>
      ) : (
        <img
          src={app.img.src}
          alt={app.img.alt}
          width={app.img.width}
          height={app.img.height}
          decoding="async"
          className={mediaCls}
        />
      )}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 via-35% to-transparent to-65% ${
          v ? "hidden sm:block" : ""
        }`}
      />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-black/55 via-black/10 via-45% to-transparent sm:block" />

      <Link href={app.href} className="absolute inset-0" aria-label={app.name} />

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 md:left-4 md:top-4">
        {app.isNew && (
          <span className="rounded border-[1.5px] border-[#0a0a0a] bg-[#7AA2FF] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]">
            new
          </span>
        )}
        <span className={chipCls}>{app.eyebrow}</span>
      </div>

      <div
        className={`pointer-events-none p-5 md:p-8 ${
          v ? "relative sm:absolute sm:inset-x-0 sm:bottom-0" : "absolute inset-x-0 bottom-0"
        }`}
      >
        <h3 className="font-slackey text-4xl leading-none text-white md:text-5xl">{app.name}</h3>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-snug text-white/90 md:text-base">{app.pitch}</p>
        <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
          {app.facts.map((f) => (
            <span
              key={f}
              className="rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/90"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`rounded px-4 py-2 text-xs font-bold transition-colors ${app.btn}`}>{app.cta}</span>
          <Link
            href={app.buildHref}
            className="pointer-events-auto text-xs font-bold text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            how it got built →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** A small tile: a compact row on phones, a photo tile with a gradient from md up. */
function SmallTile({ app }: { app: VizApp }) {
  return (
    <Link
      href={app.href}
      className="group relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 transition hover:border-gray-300 hover:shadow-sm md:block md:aspect-[16/10] md:overflow-hidden md:border-0 md:p-0 md:hover:shadow-none"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md md:absolute md:inset-0 md:h-full md:w-full md:rounded-none">
        <img
          src={app.img.src}
          alt={app.img.alt}
          width={app.img.width}
          height={app.img.height}
          decoding="async"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${app.pos.tile}`}
        />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-black/85 via-black/35 via-40% to-transparent to-75% md:block" />
      </div>
      <span className={`absolute left-3 top-3 hidden items-center gap-1.5 md:inline-flex ${chipCls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${app.dot}`} />
        {app.eyebrow}
      </span>
      <div className="min-w-0 flex-1 md:absolute md:inset-x-0 md:bottom-0 md:p-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 md:hidden">{app.eyebrow}</p>
        <h3 className="font-slackey text-lg leading-tight text-gray-900 md:text-2xl md:text-white">{app.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-gray-600 md:mt-1 md:line-clamp-none md:pr-24 md:text-white/85">
          {app.line}
        </p>
        <span className={`mt-2 inline-block rounded px-2.5 py-1 text-[11px] font-bold transition-colors md:hidden ${app.btn}`}>
          {app.cta}
        </span>
      </div>
      <span
        className={`absolute bottom-5 right-5 hidden rounded px-4 py-2 text-xs font-bold transition-colors md:inline-block ${app.btn}`}
      >
        {app.cta}
      </span>
    </Link>
  );
}

export function VizSection() {
  const featured = VIZ_APPS.find((a) => a.id === FEATURED) ?? VIZ_APPS[0];
  const rest = VIZ_APPS.filter((a) => a !== featured);

  return (
    <div>
      <SectionHeader title="the viz family" buttonText="build log" linkHref="builds" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <FeatureTile app={featured} />
        {rest.map((app) => (
          <SmallTile key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

export default VizSection;
