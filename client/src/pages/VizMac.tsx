import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Download, Hammer, Keyboard, Moon, QrCode, Sparkles, Timer } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { VizMacShell } from "@/components/vizmac/VizMacShell";
import { ControllerFrame } from "@/components/vizmac/frames";
import { ControlGlyph, SkullGlyph } from "@/components/vizmac/icons";
import { Btn, Caption, Chip, Eyebrow, Lead, SectionHeading, VbLink, linkCls } from "@/components/vizbot/bits";
import {
  APP_PART,
  BUILDLOG_URL,
  CONTROLLER_PART,
  CONTROLS,
  HIGHLIGHTS,
  HUE,
  MODES,
  PHOTOS,
  type Part,
} from "@/content/vizmac";

// vizMac overview. Layout and copy from the approved comps (vizMac repo,
// docs/site/landing.html), built from the same pieces as the vizBot overview.

const MODE_ANCHOR = { keys: "keys", np: "np", clock: "clock", wled: "wled" } as const;

function Hero() {
  return (
    <section className="grid items-center gap-7 border-b border-gray-200 pb-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 lg:pb-11 xl:grid-cols-[minmax(0,1fr)_540px] xl:gap-14">
      <div>
        <Eyebrow>a desk macropad · per-key lighting · macOS</Eyebrow>
        <h1 className="mb-4 font-slackey text-[38px] font-normal leading-[1.05] tracking-tight md:text-[54px]">
          One knob for the whole desk.
        </h1>
        <p className="mb-6 max-w-[46ch] text-base leading-relaxed text-gray-700 md:text-lg">
          vizMac is a desk macropad that does all the things. One knob and one button next to the keyboard control the
          per-key lighting, Spotify or Music, a focus timer and your WLED lights. A menu bar app on the Mac does the work.
          The controller's screen and 16×8 LEDs show what's going on.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Btn href="/vizmac/guide" icon={<BookOpen className="h-[17px] w-[17px]" />}>
            Read the guide
          </Btn>
          <Btn href="/vizmac/controller" kind="outline" icon={<ControlGlyph name="push" size={17} />}>
            The controller
          </Btn>
          <VbLink
            href={BUILDLOG_URL}
            className="inline-flex items-center gap-1.5 px-1 py-2 text-sm font-medium text-blue-600 no-underline hover:text-blue-700 sm:self-center"
          >
            How it got built <ArrowRight className="h-[15px] w-[15px]" />
          </VbLink>
        </div>
        <p className="vb-mono mt-4 text-xs text-muted-foreground">25 effects · 23 palettes · 4 controller modes · macOS</p>
      </div>
      <figure className="m-0">
        <img
          src={PHOTOS.hero.src}
          width={PHOTOS.hero.w}
          height={PHOTOS.hero.h}
          alt={PHOTOS.hero.alt}
          className="mx-auto block aspect-[4/3] h-auto w-full rounded-2xl bg-[#0e1014] object-cover shadow-[0_18px_50px_rgba(0,0,0,.28)]"
        />
        <figcaption className="vb-mono mt-3 text-center text-xs text-muted-foreground">
          vulcan pro tkl + the controller · now playing
        </figcaption>
      </figure>
    </section>
  );
}

function ModePhotos() {
  return (
    <section className="mt-10 md:mt-12" aria-labelledby="vm-modes-photos">
      <h2 id="vm-modes-photos" className="sr-only">
        The four controller modes, on the real device
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {MODES.map((m) => {
          const p = PHOTOS[m.photo];
          return (
            <VbLink
              key={m.id}
              href={`/vizmac/controller#${MODE_ANCHOR[m.id]}`}
              className="vb-focus group block overflow-hidden rounded-xl border border-gray-200 bg-white text-[#0a0a0a] no-underline transition-colors hover:border-gray-300"
            >
              <img
                src={p.src}
                width={p.w}
                height={p.h}
                alt={p.alt}
                loading="lazy"
                className="block aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="block px-3.5 py-3">
                <span className="flex items-center gap-2 text-[15px] font-bold leading-snug">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: HUE[m.id] }} aria-hidden="true" />
                  {m.name}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{m.photoSub}</span>
              </span>
            </VbLink>
          );
        })}
      </div>
    </section>
  );
}

function PartCard({ part, art, artCls = "h-[380px] md:h-[420px]" }: { part: Part; art: ReactNode; artCls?: string }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className={`flex items-center justify-center overflow-hidden bg-[#0e1014] ${artCls}`}>{art}</div>
      <div className="px-5 pb-5 pt-[18px]">
        <p className="vb-mono mb-1.5 text-[11px] font-medium uppercase tracking-[1.2px] text-indigo-800">{part.eyebrow}</p>
        <h3 className="mb-2.5 font-slackey text-[19px] font-normal leading-tight md:text-[22px]">{part.title}</h3>
        <ul className="grid gap-1.5 text-[14.5px] leading-relaxed text-gray-700">
          {part.bullets.map((b) => (
            <li key={b.k} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#7AA2FF]" aria-hidden="true" />
              <span>
                <b className="font-medium text-gray-900">{b.k}:</b> {b.v}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Parts() {
  return (
    <section className="mt-12 md:mt-16">
      <SectionHeading>two parts</SectionHeading>
      <Lead>The controller is the remote. It finds the Mac app over Wi-Fi.</Lead>
      <div className="grid gap-4 md:grid-cols-2">
        <PartCard
          part={APP_PART}
          artCls="h-[240px] md:h-[420px]"
          art={
            <img
              src={PHOTOS.keyboard.src}
              width={PHOTOS.keyboard.w}
              height={PHOTOS.keyboard.h}
              alt={PHOTOS.keyboard.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          }
        />
        <PartCard
          part={CONTROLLER_PART}
          art={
            <ControllerFrame
              screen="m-top-keys"
              leds="m-top-keys-leds"
              alt="The mode picker on the Keys card"
              className="[--sw:122px] md:[--sw:136px]"
            />
          }
        />
      </div>
    </section>
  );
}

function Modes() {
  return (
    <section className="mt-12 md:mt-16">
      <SectionHeading>four modes</SectionHeading>
      <Lead>
        Turn the knob in the mode picker to flip between them. They all keep running in the background. The screens
        are the controller's own.
      </Lead>
      <div className="grid gap-4 md:grid-cols-2">
        {MODES.map((m) => (
          <article key={m.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-col items-center justify-center bg-[#0e1014] py-7">
              <ControllerFrame screen={m.screen} leds={m.leds} alt={`${m.name} on the controller`} className="[--sw:132px] md:[--sw:150px]" />
              <Caption className="mt-5">{m.caption}</Caption>
            </div>
            <div className="px-5 pb-5 pt-[18px]">
              <h3 className="mb-1.5 flex items-center gap-2 font-slackey text-[17px] font-normal leading-tight md:text-lg">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: HUE[m.id] }} aria-hidden="true" />
                {m.name}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ControlsBand() {
  // KO and hold KO share one line here; the controller page has them apart.
  const rows = CONTROLS.filter((c) => c.short);
  const order = ["Turn", "Push the knob", "KO", "Hold the knob 2 s"];
  rows.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
  return (
    <section className="mt-12 md:mt-16">
      <div className="grid items-center gap-7 rounded-2xl bg-[#0e1014] px-5 py-6 text-white shadow-[0_18px_50px_rgba(0,0,0,.28)] md:px-11 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div>
          <Eyebrow className="text-[#7AA2FF]">drive it</Eyebrow>
          <h2 className="font-slackey text-[28px] font-normal leading-tight text-white md:text-4xl">A knob and one button.</h2>
          <p className="mt-3 max-w-[50ch] text-[15px] leading-relaxed text-gray-300 md:text-base">
            The same moves everywhere. The bottom line of every screen says what they do right now.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {rows.map((c) => (
              <li key={c.k} className="flex items-center gap-3 text-[15px] text-gray-200">
                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] bg-white/10 text-[#7AA2FF]">
                  <ControlGlyph name={c.glyph} />
                </span>
                <span>
                  <b className="font-bold text-white">{c.k}</b> <span className="text-gray-400">·</span> {c.short}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-[22px]">
            <Btn href="/vizmac/controller#buttons" kind="ondark" iconRight={<ArrowRight className="h-4 w-4" />}>
              How the buttons work
            </Btn>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <ControllerFrame
            screen="m-top-np"
            leds="np-eq-leds"
            alt="The mode picker on the Now Playing card"
            className="[--sw:150px] sm:[--sw:170px]"
          />
          <Caption className="mt-5">the mode picker · turn to flip, KO to open</Caption>
        </div>
      </div>
    </section>
  );
}

const HIGHLIGHT_ICON = {
  keyboard: Keyboard,
  sparkles: Sparkles,
  timer: Timer,
  moon: Moon,
  qr: QrCode,
  download: Download,
} as const;

function Highlights() {
  return (
    <section className="mt-12 md:mt-16">
      <SectionHeading>the small stuff</SectionHeading>
      <Lead>Six details from the Mac app and the controller.</Lead>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {HIGHLIGHTS.map((h) => {
          const Icon = HIGHLIGHT_ICON[h.icon];
          return (
            <article key={h.title} className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-[18px]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[#7AA2FF]">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
                </span>
                <p className="text-[15px] font-bold leading-snug text-gray-900">{h.title}</p>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{h.body}</p>
              <div className="flex flex-wrap gap-[5px]">
                {h.chips.map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BigCard({ href, icon, title, body, cta }: { href: string; icon: ReactNode; title: string; body: string; cta: string }) {
  return (
    <VbLink
      href={href}
      className="vb-focus flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-[18px] text-[#0a0a0a] no-underline transition-colors hover:border-gray-300 hover:bg-gray-50 md:px-6 md:py-[22px]"
    >
      <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[#7AA2FF]">
        {icon}
      </span>
      <span className="block">
        <span className="block font-slackey text-[19px] leading-tight md:text-[22px]">{title}</span>
        <span className="mt-1.5 block text-[14.5px] leading-relaxed text-muted-foreground">{body}</span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600">
          {cta} <ArrowRight className="h-[15px] w-[15px]" />
        </span>
      </span>
    </VbLink>
  );
}

export default function VizMac() {
  return (
    <>
      <SEO
        title="vizMac · one knob for the whole desk"
        description="A desk macropad for the Mac. One knob and one button run per-key lighting on a ROCCAT Vulcan Pro TKL, Spotify and Music, a focus timer and your WLED lights."
        image={PHOTOS.hero.src}
        keywords="vizMac, macropad, ROCCAT Vulcan Pro TKL, per-key RGB, macOS, ESP32-S3, WLED, focus timer, Spotify"
      />
      <VizMacShell>
        <Hero />
        <ModePhotos />
        <Parts />
        <Modes />
        <ControlsBand />
        <Highlights />

        <section className="mt-10 md:mt-12">
          <div className="flex flex-col items-start gap-3.5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 md:flex-row md:items-center md:justify-between md:px-5">
            <p className="text-[15px] leading-relaxed text-gray-700">
              <span className="vb-mono mr-2 text-xs font-medium uppercase tracking-[1px] text-indigo-800">renamed</span>
              vizKeys is now vizMac. Same app, plus a controller with four modes.
            </p>
            <VbLink href={BUILDLOG_URL} className={`${linkCls} whitespace-nowrap`}>
              Build log →
            </VbLink>
          </div>
        </section>

        <section className="mt-10 grid gap-3.5 md:mt-12 lg:grid-cols-3">
          <BigCard
            href="/vizmac/guide"
            icon={<BookOpen className="h-[22px] w-[22px]" strokeWidth={1.9} />}
            title="User guide"
            body="The menu bar app, the web UI, and fixes for when something's off."
            cta="Open the guide"
          />
          <BigCard
            href="/vizmac/controller"
            icon={<SkullGlyph className="h-[22px] w-[22px]" strokeWidth={1.9} />}
            title="The controller"
            body="Every button and mode, Wi-Fi setup from your phone, and updates."
            cta="Learn the controller"
          />
          <BigCard
            href={BUILDLOG_URL}
            icon={<Hammer className="h-[22px] w-[22px]" strokeWidth={1.9} />}
            title="Build log"
            body="Day by day, with photos: the USB protocol, the case and the four modes."
            cta="Read the build log"
          />
        </section>
      </VizMacShell>
    </>
  );
}
