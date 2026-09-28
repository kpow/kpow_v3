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
// Photos are from the build log, in client/public/images/home-viz/.

import { Link } from "wouter";
import SectionHeader from "@/components/global/SectionHeader";

type VizId = "vizmac" | "vizbot" | "vizspot";

/** The app in the big tile. When vizMac isn't new any more, feature the next newest build. */
const FEATURED: VizId = "vizmac";

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
      "Firmware that gives a little ESP32 screen a face. It makes faces and mutters in speech bubbles. It keeps an eye on the time and weather. Poke it and it pokes back.",
    facts: ["25 expressions", "16 scenes", "4 boards"],
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

/** The big tile: 2x2 on desktop. A div with a full-tile link, so it can hold the build log link too. */
function FeatureTile({ app }: { app: VizApp }) {
  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-[#0e1014] sm:aspect-[16/10] md:col-span-2 lg:row-span-2 lg:aspect-auto">
      <img
        src={app.img.src}
        alt={app.img.alt}
        width={app.img.width}
        height={app.img.height}
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${app.pos.feature}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 via-35% to-transparent to-65%" />
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-8">
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
