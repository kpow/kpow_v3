import { ChevronDown } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { LabzShell } from "@/components/labz/LabzShell";
import { Bullets, IconStrip, Rows, Shot, Tags } from "@/components/labz/bits";
import { Callout, Code, Lead, Rich, SectionHeading, Step, SubHead } from "@/components/vizbot/bits";
import { DocHero, JumpBar, Toc, sectionCls, useActiveSection } from "@/components/vizbot/docs";
import {
  BROWSE_NOTES,
  COLORS_NOTES,
  CONFLICT_NOTE,
  EDITOR_NOTES,
  FIXES,
  GUIDE_TOC,
  PATTERNS,
  PHOTOS,
  SAVER_MODES,
  SAVER_ROWS,
  SAVE_STEPS,
  SETTINGS_ROWS,
  SETUP_NOTE,
  SETUP_STEPS,
  STATUS_DOTS,
  TILES,
  TOOLS,
  TRANSITIONS,
  UPDATE_NOTE,
  UPDATE_STEPS,
  UPDATE_WARN,
} from "@/content/labz";
import { cn } from "@/lib/utils";

// 8x8 labz user guide: the handheld, screen by screen. The overview is /8x8.
// Layout on vizBot's doc frame: DocHero, sticky Toc, JumpBar.

function Setup() {
  return (
    <section id="setup" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>first run</SectionHeading>
      <Lead>A new handheld knows nothing. Five minutes on a phone and it knows everything.</Lead>
      <div className="grid gap-2.5">
        {SETUP_STEPS.map((s, i) => (
          <Step key={i} n={i + 1}>
            <Rich text={s} />
          </Step>
        ))}
      </div>
      <Callout className="mt-3.5">
        <Rich text={SETUP_NOTE} />
      </Callout>
    </section>
  );
}

function Home() {
  return (
    <section id="home" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={2}>home</SectionHeading>
      <Lead>Four big tiles, with how the sync is going along the top.</Lead>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Rows rows={TILES} cols="sm:grid-cols-[110px_1fr]" />
        <Shot photo={PHOTOS.matrix} ratio="aspect-[16/9]" caption="the matrix, at the default brightness" />
      </div>

      <SubHead>The status dot</SubHead>
      <Rows rows={STATUS_DOTS} cols="sm:grid-cols-[110px_1fr]" />
      <p className="mt-3.5 max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        When edits are waiting to go up, the line reads <Code>N icons | M to upload</Code> instead of how long ago it
        synced.
      </p>
    </section>
  );
}

function Browse() {
  return (
    <section id="browse" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>browsing icons</SectionHeading>
      <Lead>Everything the handheld has cached, which is everything in the catalog.</Lead>
      <Bullets items={BROWSE_NOTES} />
      <Shot
        className="mt-6"
        photo={PHOTOS.pacghost}
        ratio="aspect-[16/9]"
        caption="an icon on the detail screen is also pinned on the LEDs"
      />
    </section>
  );
}

function Editor() {
  return (
    <section id="editor" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>the editor</SectionHeading>
      <Lead>An 8×8 canvas, a stylus, and the matrix showing you what you're actually making.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <Rows rows={TOOLS} cols="sm:grid-cols-[120px_1fr]" />
          <Bullets className="mt-5" items={EDITOR_NOTES} />
        </div>
        <Shot photo={PHOTOS.editor} ratio="aspect-[3/4]" caption="part-drawn, tools on the right" />
      </div>

      <SubHead>Saving</SubHead>
      <div className="grid gap-2.5">
        {SAVE_STEPS.map((s, i) => (
          <Step key={i} n={i + 1}>
            <Rich text={s} />
          </Step>
        ))}
      </div>
      <Callout className="mt-3.5">
        <Rich text={CONFLICT_NOTE} />
      </Callout>
    </section>
  );
}

function Leds() {
  return (
    <section id="leds" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={5}>the LEDs</SectionHeading>
      <Lead>
        The matrix shows a pinned icon, a live mirror of the canvas, the screen saver, a wiring test, or nothing. The
        leds tile on Home cycles the last three.
      </Lead>

      <SubHead>The screen saver</SubHead>
      <Rows rows={SAVER_MODES} cols="sm:grid-cols-[120px_1fr]" />

      <SubHead>The sixteen patterns</SubHead>
      <p className="max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        Ported from vizpow's ambient effects. Pick one, or shuffle them all.
      </p>
      <Tags items={PATTERNS} />

      <SubHead>The nine transitions</SubHead>
      <p className="max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        Between one icon or pattern and the next. Sparkle picks a different random order every time.
      </p>
      <Tags items={TRANSITIONS} />

      <div className="mt-8 rounded-2xl bg-[#0e1014] p-6">
        <IconStrip px={12} />
        <p className="vb-mono mt-4 text-center text-[11px] tracking-[.3px] text-gray-400">
          what the slideshow is working with
        </p>
      </div>
    </section>
  );
}

function Settings() {
  return (
    <section id="settings" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={6}>every setting</SectionHeading>
      <Lead>
        The three lines at the bottom of the page are the diagnostics: firmware version, address, cached icons, the
        catalog it's pointed at, edits waiting, why it last restarted, and how much memory the last sync had.
      </Lead>
      <Rows rows={SETTINGS_ROWS} cols="sm:grid-cols-[150px_1fr]" />

      <SubHead>Settings › Saver</SubHead>
      <p className="mb-3.5 max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        Every change saves and restarts the screen saver on the LEDs, so you see it straight away.
      </p>
      <Rows rows={SAVER_ROWS} cols="sm:grid-cols-[150px_1fr]" />

      <SubHead>Settings › Colors</SubHead>
      <Bullets items={COLORS_NOTES} />
      <Shot
        className="mt-5"
        photo={PHOTOS.editorSprite}
        ratio="aspect-[4/3]"
        caption="screen and matrix, side by side — which is the whole point of the page"
      />
    </section>
  );
}

function Update() {
  return (
    <section id="update" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={7}>updating over WiFi</SectionHeading>
      <Lead>No cable, no computer hunting for a serial port. A web page the handheld serves itself.</Lead>
      <div className="grid gap-2.5">
        {UPDATE_STEPS.map((s, i) => (
          <Step key={i} n={i + 1}>
            <Rich text={s} />
          </Step>
        ))}
      </div>
      <Callout className="mt-3.5">
        <Rich text={UPDATE_NOTE} />
      </Callout>
      <Callout kind="warn" className="mt-2.5">
        <Rich text={UPDATE_WARN} />
      </Callout>
    </section>
  );
}

function Help() {
  return (
    <section id="help" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={8}>if something's off</SectionHeading>
      <Lead>The handful of things that actually go wrong, and what each one means.</Lead>
      {/* phones: disclosures; wider: cards */}
      <div className="mt-[18px] grid gap-2 md:hidden">
        {FIXES.map((f, i) => (
          <details key={f.title} open={i === 0} className="rounded-[10px] border border-gray-200 bg-white">
            <summary className="flex cursor-pointer items-center justify-between gap-2.5 px-3.5 py-[13px] text-[15px] font-bold text-gray-900">
              {f.title}
              <ChevronDown className="vb-chev h-4 w-4 flex-none text-gray-600" />
            </summary>
            <p className="px-3.5 pb-3.5 text-sm leading-relaxed text-gray-700">
              <Rich text={f.body} />
            </p>
          </details>
        ))}
      </div>
      <div className="mt-5 hidden gap-3.5 md:grid md:grid-cols-2">
        {FIXES.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-[18px]">
            <h3 className="vb-plain mb-1.5 text-[15px] font-bold text-gray-900">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <Rich text={f.body} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function EightByEightGuide() {
  const active = useActiveSection(GUIDE_TOC);
  useHashScroll();

  return (
    <>
      <SEO />
      <LabzShell>
        <DocHero
          eyebrow="user guide · the handheld"
          title="Getting going with 8x8 labz."
          lead={
            <>
              Setting one up, every screen on it, every setting, and updating it over WiFi. The overview is on{" "}
              <span className="vb-mono text-[.92em]">/8x8</span>; the format and the API are in the repo.
            </>
          }
          quick={[
            { t: "First run", d: "WiFi, the catalog, the first sync.", href: "setup", n: 1 },
            { t: "The editor", d: "Draw, animate, save as new.", href: "editor", n: 4 },
            { t: "Stuck?", d: "Common problems and fixes.", href: "help", n: 8 },
          ]}
        />
        <JumpBar items={GUIDE_TOC} active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc
            items={GUIDE_TOC}
            active={active}
            label="Guide sections"
            footer={
              <a
                href="https://github.com/kpow/8x8"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 px-2 py-1 text-[13px] text-gray-600 no-underline hover:text-gray-900"
              >
                The code on GitHub
              </a>
            }
          />
          <div className="min-w-0">
            <Setup />
            <Home />
            <Browse />
            <Editor />
            <Leds />
            <Settings />
            <Update />
            <Help />
          </div>
        </div>
      </LabzShell>
    </>
  );
}
