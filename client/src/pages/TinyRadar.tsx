import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Box, Download, Hammer, Map, MapPin, Power, RefreshCw, Smartphone } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { TinyRadarShell, Scope } from "@/components/tinyradar/TinyRadarShell";
import { Rows, Shot } from "@/components/labz/bits";
import { Btn, Chip, Code, Eyebrow, Lead, Rich, SectionHeading, VbLink } from "@/components/vizbot/bits";
import {
  BUILDLOG_URL,
  BUTTON_ROWS,
  CASE_FACTS,
  HEIGHT_BANDS,
  HIGHLIGHTS,
  HOST,
  PAGE_PART,
  PHOTOS,
  WALKAROUND,
  RADAR_PART,
  SCREEN,
  type Part,
} from "@/content/tinyradar";

// tinyradar overview. Built from the same pieces as the vizMac and 8x8 labz
// overviews; the long version is /tinyradar/guide. Pictures are of the first
// finished unit, from the build log.

function Hero() {
  return (
    <section className="grid items-center gap-7 border-b border-gray-200 pb-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 lg:pb-11 xl:grid-cols-[minmax(0,1fr)_540px] xl:gap-14">
      <div>
        <Eyebrow>a desk radar · live planes overhead · esp32</Eyebrow>
        <h1 className="mb-4 font-slackey text-[38px] font-normal leading-[1.05] tracking-tight md:text-[54px]">
          The sky over your house, on your desk.
        </h1>
        <p className="mb-6 max-w-[46ch] text-base leading-relaxed text-gray-700 md:text-lg">
          tinyradar is a little cabinet with a round radar screen. It shows the planes flying around your home right
          now, on a map of your town, from a public flight feed. No antenna, no app: plug it in, set it up from your
          phone, and it just runs.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Btn href="/tinyradar/guide" icon={<BookOpen className="h-[17px] w-[17px]" />}>
            Read the guide
          </Btn>
          <Btn href="/tinyradar/update" kind="outline" icon={<Download className="h-[17px] w-[17px]" />}>
            Updates
          </Btn>
          <VbLink
            href={BUILDLOG_URL}
            className="inline-flex items-center gap-1.5 px-1 py-2 text-sm font-medium text-blue-600 no-underline hover:text-blue-700 sm:self-center"
          >
            How it got built <ArrowRight className="h-[15px] w-[15px]" />
          </VbLink>
        </div>
        <p className="vb-mono mt-4 text-xs text-muted-foreground">up to 64 planes · 6 ranges · 7 looks · updates over Wi-Fi</p>
      </div>
      <Shot photo={PHOTOS.front} priority ratio="aspect-[4/5]" caption="the first one, with planes over its town" />
    </section>
  );
}

function Screen() {
  return (
    <section className="mt-10 grid items-start gap-8 md:mt-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
      <div className="min-w-0">
        <SectionHeading>On the screen</SectionHeading>
        <Lead>A sweep goes round, the planes move between updates, and the screen redraws about 27 times a second.</Lead>
        <Rows rows={SCREEN} cols="sm:grid-cols-[110px_1fr]" />
      </div>
      <div className="rounded-2xl bg-[#0e1014] p-6 text-white">
        <p className="vb-mono mb-3.5 text-[11px] font-medium uppercase tracking-[1.2px] text-[#1DFF86]">height, in the map looks</p>
        <ul className="grid gap-2">
          {HEIGHT_BANDS.map((b) => (
            <li key={b.l} className="flex items-center gap-3 text-[14px] text-gray-200">
              <span className="h-3 w-3 flex-none rotate-45 rounded-[2px]" style={{ background: b.c }} aria-hidden="true" />
              {b.l}
              {b.l.startsWith("under") ? "" : " ft"}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-relaxed text-gray-400">The classic looks draw every plane in one colour, with its type and height next to it.</p>
      </div>
    </section>
  );
}

function PartCard({ part, art }: { part: Part; art: ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {art}
      <div className="px-5 pb-5 pt-[18px]">
        <p className="vb-mono mb-1.5 text-[11px] font-medium uppercase tracking-[1.2px] text-[var(--vb-yellow-ink)]">
          {part.eyebrow}
        </p>
        <h3 className="mb-2.5 font-slackey text-[19px] font-normal leading-tight md:text-[22px]">{part.title}</h3>
        <ul className="grid gap-1.5 text-[14.5px] leading-relaxed text-gray-700">
          {part.bullets.map((b) => (
            <li key={b.k} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[var(--vb-yellow)]" aria-hidden="true" />
              <span>
                <b className="font-medium text-gray-900">{b.k}:</b> <Rich text={b.v} />
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
    <section className="mt-12 md:mt-14">
      <SectionHeading>Two halves</SectionHeading>
      <Lead>The radar does the watching. Its web page is where you set it up and change things.</Lead>
      <div className="grid gap-5 md:grid-cols-2">
        <PartCard
          part={RADAR_PART}
          art={
            <img
              src={PHOTOS.threeQuarter.src}
              width={PHOTOS.threeQuarter.w}
              height={PHOTOS.threeQuarter.h}
              alt={PHOTOS.threeQuarter.alt}
              loading="lazy"
              className="block aspect-[4/3] w-full bg-[#0e1014] object-cover object-[center_42%]"
            />
          }
        />
        <PartCard
          part={PAGE_PART}
          art={
            // No screenshot of the web page here: every one shows the bench radar's home.
            <div className="grid aspect-[4/3] w-full place-items-center bg-[#030605] p-6">
              <div className="text-center">
                <Scope size={120} className="mx-auto" />
                <p className="vb-mono mt-5 text-[15px] font-medium text-[#1DFF86]">http://{HOST}</p>
                <p className="mt-1 text-[13px] text-gray-400">on any phone or laptop on your Wi-Fi</p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}

function ButtonBand() {
  return (
    <section className="mt-12 md:mt-14">
      <div className="grid items-center gap-7 rounded-2xl bg-[#0e1014] px-5 py-6 text-white shadow-[0_18px_50px_rgba(0,0,0,.28)] md:px-11 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div>
          <Eyebrow className="text-[#1DFF86]">the controls</Eyebrow>
          <h2 className="font-slackey text-[28px] font-normal leading-tight text-white md:text-4xl">One green button.</h2>
          <p className="mt-3 max-w-[50ch] text-[15px] leading-relaxed text-gray-300 md:text-base">
            Everything else is on its web page. The button is for the one thing you do most: look farther or closer.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {BUTTON_ROWS.slice(0, 2).map((r) => (
              <li key={r.k} className="flex items-start gap-3 text-[15px] text-gray-200">
                <span className="mt-0.5 grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-[#22c55e] shadow-[inset_0_-3px_0_rgba(0,0,0,.35)]" aria-hidden="true" />
                <span>
                  <b className="font-bold text-white">{r.k}</b> <span className="text-gray-400">·</span> {r.v}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-[22px]">
            <Btn href="/tinyradar/guide#button" kind="ondark" iconRight={<ArrowRight className="h-4 w-4" />}>
              The range button
            </Btn>
          </div>
        </div>
        <figure className="m-0">
          <video
            src={WALKAROUND.src}
            poster={WALKAROUND.poster}
            width={WALKAROUND.w}
            height={WALKAROUND.h}
            aria-label={WALKAROUND.label}
            controls
            muted
            playsInline
            preload="none"
            className="block aspect-video h-auto w-full rounded-xl bg-black"
          />
          <figcaption className="vb-mono mt-2.5 text-center text-xs text-gray-400">a press, then round the back · 33 s</figcaption>
        </figure>
      </div>
    </section>
  );
}

const HIGHLIGHT_ICON = { map: Map, phone: Smartphone, update: RefreshCw, power: Power, pin: MapPin, case: Box } as const;

function Highlights() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>Made to be a gift</SectionHeading>
      <Lead>It's going to people in other cities who will never plug it into a computer. So:</Lead>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {HIGHLIGHTS.map((h) => {
          const Icon = HIGHLIGHT_ICON[h.icon];
          return (
            <article key={h.title} className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-[18px]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[var(--vb-yellow)]">
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

function Case() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>The case</SectionHeading>
      <Lead>Printed in four parts and held together with screws, so it can be opened again.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <Shot photo={PHOTOS.faceplate} caption="the faceplate: carbon-fibre texture and a lime ring" />
          <div className="grid grid-cols-2 gap-4">
            <Shot photo={PHOTOS.wiring} ratio="aspect-square" caption="opened up: the wiring" />
            <Shot photo={PHOTOS.testBodies} ratio="aspect-square" caption="the first case and three test bodies" />
          </div>
        </div>
        <Rows rows={CASE_FACTS} cols="sm:grid-cols-[120px_1fr]" />
      </div>
    </section>
  );
}

function Next() {
  const cards = [
    {
      href: "/tinyradar/guide",
      icon: <BookOpen className="h-6 w-6 text-[var(--vb-yellow-ink)]" />,
      t: "The user guide",
      d: "Plugging it in, Wi-Fi from your phone, your location, the web page, and what to do when something's off.",
    },
    {
      href: "/tinyradar/update",
      icon: <Download className="h-6 w-6 text-[var(--vb-yellow-ink)]" />,
      t: "Updates",
      d: "The newest version, what's in it, and how to install it from the radar's own page.",
    },
    {
      href: BUILDLOG_URL,
      icon: <Hammer className="h-6 w-6 text-[var(--vb-yellow-ink)]" />,
      t: "The build log",
      d: "How it got made: living in a tiny heap, real maps, updates that roll back, and the case.",
    },
  ];
  return (
    <section className="mt-12 grid gap-4 md:mt-14 lg:grid-cols-3">
      {cards.map((c) => (
        <VbLink
          key={c.href}
          href={c.href}
          className="vb-focus flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 no-underline hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-lg bg-[var(--vb-tint)]">{c.icon}</span>
          <span className="block">
            <span className="block text-[15px] font-bold text-gray-900">{c.t}</span>
            <span className="mt-0.5 block text-[13.5px] text-muted-foreground">{c.d}</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 flex-none text-gray-400" />
        </VbLink>
      ))}
    </section>
  );
}

export default function TinyRadar() {
  return (
    <>
      <SEO />
      <TinyRadarShell>
        <Hero />
        <Screen />
        <Parts />
        <ButtonBand />
        <Highlights />
        <Case />

        <section className="mt-10 md:mt-12">
          <div className="flex flex-col items-start gap-3.5 rounded-xl border border-green-200 bg-green-50 p-4 md:flex-row md:items-center md:justify-between md:px-5">
            <p className="text-[15px] leading-relaxed text-gray-700">
              <span className="vb-mono mr-2 text-xs font-medium uppercase tracking-[1px] text-green-800">renamed</span>
              Plane Radar is now tinyradar. Its address is <Code>{HOST}</Code>.
            </p>
            <VbLink href={BUILDLOG_URL} className="whitespace-nowrap font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
              Build log →
            </VbLink>
          </div>
        </section>

        <Next />
      </TinyRadarShell>
    </>
  );
}
