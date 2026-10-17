import { ArrowRight, BookOpen, Grid3x3, Hammer } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { LabzShell } from "@/components/labz/LabzShell";
import { Bullets, IconStrip, PixelGrid, Rows, Shot } from "@/components/labz/bits";
import { Btn, Eyebrow, Lead, SectionHeading, VbLink } from "@/components/vizbot/bits";
import {
  BUILDLOG_URL,
  FACTS,
  HANDHELD_PART,
  HIGHLIGHTS,
  PHOTOS,
  REPO_URL,
  RULES,
  WEB_PART,
  type Part,
} from "@/content/labz";

// 8x8 labz overview. Built from the same pieces as the vizBot and vizMac
// overviews; the long version is /8x8/guide.

function Hero() {
  return (
    <section className="grid items-center gap-7 border-b border-gray-200 pb-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-12 lg:pb-11 xl:grid-cols-[minmax(0,1fr)_560px] xl:gap-14">
      <div>
        <Eyebrow>a pocket sketchbook · 8×8 pixels · esp32</Eyebrow>
        <h1 className="mb-4 font-slackey text-[38px] font-normal leading-[1.05] tracking-tight md:text-[54px]">
          An 8×8 sketchbook that glows.
        </h1>
        <p className="mb-6 max-w-[46ch] text-base leading-relaxed text-gray-700 md:text-lg">
          8x8 labz is a handheld for drawing tiny pixel icons. One web app holds the whole catalog, the handheld carries
          all of it in your pocket, and whatever you draw is lit up on a real 8×8 LED matrix while you draw it.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Btn href="/8x8/guide" icon={<BookOpen className="h-[17px] w-[17px]" />}>
            Read the guide
          </Btn>
          <Btn href={REPO_URL} kind="outline" icon={<Grid3x3 className="h-[17px] w-[17px]" />}>
            The code
          </Btn>
          <VbLink
            href={BUILDLOG_URL}
            className="inline-flex items-center gap-1.5 px-1 py-2 text-sm font-medium text-blue-600 no-underline hover:text-blue-700 sm:self-center"
          >
            How it got built <ArrowRight className="h-[15px] w-[15px]" />
          </VbLink>
        </div>
        <p className="vb-mono mt-4 text-xs text-muted-foreground">
          30 seed icons · 16 patterns · 9 transitions · draws offline
        </p>
      </div>
      <Shot photo={PHOTOS.hero} priority caption="the handheld, mid-sync" />
    </section>
  );
}

function Why() {
  return (
    <section className="mt-10 grid items-center gap-8 md:mt-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <div>
        <SectionHeading>Why</SectionHeading>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-gray-700">
          It started with watching artists at live sketch events, each with a pocket sketchbook, catching an idea the
          moment it showed up. I wanted the same thing in my own medium: a page that is an 8×8 grid and ink that is
          light.
        </p>
        <p className="mt-3.5 max-w-[62ch] text-[15px] leading-relaxed text-gray-700">
          There was a practical reason too. Old-school 8×8 icons had been hand-typed into C arrays across several
          firmware projects, every copy quietly drifting from the others. Now there's one catalog, and everything else
          pulls from it.
        </p>
        <Bullets className="mt-5" items={HIGHLIGHTS.map((h) => `**${h.k}.** ${h.v}`)} />
      </div>
      <div className="rounded-2xl bg-[#0e1014] p-6">
        <IconStrip px={11} cols="grid-cols-4" />
        <p className="vb-mono mt-4 text-center text-[11px] tracking-[.3px] text-gray-400">
          sixteen from the catalog, at real resolution
        </p>
      </div>
    </section>
  );
}

function PartCard({ part, children }: { part: Part; children: React.ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {children}
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
                <b className="font-medium text-gray-900">{b.k}:</b> {b.v}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Halves() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>Two halves</SectionHeading>
      <Lead>The catalog lives on the web. The handheld carries it around and draws into it.</Lead>
      <div className="grid gap-5 md:grid-cols-2">
        <PartCard part={HANDHELD_PART}>
          <img
            src={PHOTOS.editorSprite.src}
            width={PHOTOS.editorSprite.w}
            height={PHOTOS.editorSprite.h}
            alt={PHOTOS.editorSprite.alt}
            loading="lazy"
            className="block aspect-[4/3] w-full object-cover"
          />
        </PartCard>
        <PartCard part={WEB_PART}>
          {/* No web screenshot in the photo set, and a handheld photo here would be a
              lie about which half you're looking at — so: the catalog itself. */}
          <div className="grid aspect-[4/3] w-full place-items-center bg-[#0e1014] p-5">
            <IconStrip
              px={13}
              cols="grid-cols-4"
              slugs={["heart", "star", "fire", "ghost", "invader", "mushroom", "dragon", "rainbow"]}
            />
          </div>
        </PartCard>
      </div>
    </section>
  );
}

function Rules() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>Nothing breaks downstream</SectionHeading>
      <Lead>
        Four rules make one catalog safe to be the source of truth for several firmware projects at once. They're the
        whole reason this exists instead of a folder of hand-typed C arrays.
      </Lead>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {RULES.map((r) => (
          <div key={r.title} className="rounded-xl border border-gray-200 bg-white p-[18px]">
            <h3 className="vb-plain mb-1.5 text-[15px] font-bold text-gray-900">{r.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </div>
      <Rows className="mt-6" rows={FACTS} cols="sm:grid-cols-[150px_1fr]" />
    </section>
  );
}

function Cases() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>In a case</SectionHeading>
      <Lead>One to sit on a desk, one to carry. Both printed, both holding the same board.</Lead>
      <div className="grid gap-4 sm:grid-cols-3">
        <Shot photo={PHOTOS.caseDesktop} caption="the desktop case" />
        <Shot photo={PHOTOS.caseMobile} caption="the mobile case" />
        <Shot photo={PHOTOS.inHand} caption="in hand" />
      </div>
    </section>
  );
}

function Next() {
  return (
    <section className="mt-12 grid gap-4 md:mt-14 md:grid-cols-2">
      <VbLink
        href="/8x8/guide"
        className="vb-focus flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 no-underline hover:border-gray-300 hover:bg-gray-50"
      >
        <PixelGrid icon="star" px={7} />
        <span className="block">
          <span className="block text-[15px] font-bold text-gray-900">The user guide</span>
          <span className="mt-0.5 block text-[13.5px] text-muted-foreground">
            First run, every screen, every setting, updating over WiFi, and what to do when something's off.
          </span>
        </span>
        <ArrowRight className="ml-auto h-4 w-4 flex-none text-gray-400" />
      </VbLink>
      <VbLink
        href={BUILDLOG_URL}
        className="vb-focus flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 no-underline hover:border-gray-300 hover:bg-gray-50"
      >
        <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-lg bg-[var(--vb-tint)]">
          <Hammer className="h-6 w-6 text-[var(--vb-yellow-ink)]" />
        </span>
        <span className="block">
          <span className="block text-[15px] font-bold text-gray-900">The build log</span>
          <span className="mt-0.5 block text-[13.5px] text-muted-foreground">
            How it got made: the format, living in 320 KB, and the cases it ended up in.
          </span>
        </span>
        <ArrowRight className="ml-auto h-4 w-4 flex-none text-gray-400" />
      </VbLink>
    </section>
  );
}

export default function EightByEight() {
  return (
    <>
      <SEO />
      <LabzShell>
        <Hero />
        <Why />
        <Halves />
        <Rules />
        <Cases />
        <Next />
      </LabzShell>
    </>
  );
}
