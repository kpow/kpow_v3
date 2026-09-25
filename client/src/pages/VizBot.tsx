import { ArrowRight, BookOpen, Download } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { VizBotShell } from "@/components/vizbot/VizBotShell";
import { DinoFrame, LandscapeFrame } from "@/components/vizbot/frames";
import { BoardIcon, GestureGlyph } from "@/components/vizbot/icons";
import { Btn, Caption, Chip, Code, Eyebrow, Lead, SectionHeading, Stage, VbLink, linkCls } from "@/components/vizbot/bits";
import { BOARDS, DOC_VERSION, FEATURES, GESTURES_SHORT, REPO_URL, SCREENS } from "@/content/vizbot";

// vizBot overview. Copy and layout from the approved comps (Main / IntroMobile).

function Hero() {
  return (
    <section className="grid items-center gap-7 border-b border-gray-200 pb-10 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-14 lg:pb-11">
      <div>
        <Eyebrow>a tiny desk robot · open-source firmware</Eyebrow>
        <h1 className="mb-4 font-slackey text-[38px] font-normal leading-[1.05] tracking-tight md:text-[54px]">
          Hi. I live on your desk.
        </h1>
        <p className="mb-6 max-w-[46ch] text-base leading-relaxed text-gray-700 md:text-lg">
          vizBot is firmware that gives a small ESP32 screen a face and a personality. It pulls faces, mutters in
          speech bubbles, keeps the time and the weather, and paints slow light shows behind its eyes. Poke it and it
          pokes back.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Btn href="/vizbot/releases" icon={<Download className="h-[17px] w-[17px]" />}>
            Get the firmware
          </Btn>
          <Btn href="/vizbot/guide" kind="outline" icon={<BookOpen className="h-[17px] w-[17px]" />}>
            Read the guide
          </Btn>
        </div>
        <p className="vb-mono mt-4 text-xs text-muted-foreground">
          v{DOC_VERSION} · 4 boards · MIT licensed ·{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-600 underline underline-offset-2">
            source on GitHub
          </a>
        </p>
      </div>
      <Stage className="px-4 pb-[18px] pt-5 md:px-7 md:pb-[22px] md:pt-7">
        <div className="relative flex flex-col items-center pt-6 md:pt-9">
          <DinoFrame src={SCREENS.home} alt="vizBot's home screen: a big-eyed face" eager className="[--sw:200px] md:[--sw:240px]" />
          <div className="absolute right-0 top-0 whitespace-nowrap rounded-[14px] bg-white px-3.5 py-2 font-slackey text-base leading-tight text-[#0a0a0a] shadow-[0_8px_20px_rgba(0,0,0,.35)] md:right-1.5 md:top-2.5">
            hi! poke me.
          </div>
          <Caption className="mt-4">real screen · waveshare 1.69 · v{DOC_VERSION}</Caption>
        </div>
      </Stage>
    </section>
  );
}

function Features() {
  return (
    <section className="mt-12 md:mt-16">
      <SectionHeading>what it's like</SectionHeading>
      <Lead>
        Part pet, part desk clock, part lava lamp. Everything below is from real screens running {DOC_VERSION}.
      </Lead>
      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <article key={f.title} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex h-[300px] flex-col items-center justify-center bg-[#0e1014] md:h-[344px]">
              {f.frame === "dino" ? (
                <DinoFrame src={SCREENS[f.screen]} alt={f.title} className="[--sw:150px] md:[--sw:170px]" />
              ) : (
                <LandscapeFrame src={SCREENS[f.screen]} alt={f.title} className="[--sw:250px] md:[--sw:300px]" />
              )}
              <Caption className="mt-3.5">{f.caption}</Caption>
            </div>
            <div className="px-5 pb-5 pt-[18px]">
              <h3 className="mb-1.5 font-slackey text-[17px] font-normal leading-tight md:text-lg">{f.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TouchBand() {
  return (
    <section className="mt-12 md:mt-16">
      <div className="grid items-center gap-7 rounded-2xl bg-[#0e1014] px-5 py-6 text-white shadow-[0_18px_50px_rgba(0,0,0,.28)] md:px-11 md:py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div>
          <Eyebrow className="text-[#FFD23F]">touch it</Eyebrow>
          <h2 className="font-slackey text-[28px] font-normal leading-tight text-white md:text-4xl">One swipe away.</h2>
          <p className="mt-3 max-w-[50ch] text-[15px] leading-relaxed text-gray-300 md:text-base">
            The face owns the screen. Everything else sits under a gesture: moods, scenes, brightness, and a full
            settings menu on the bot itself.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {GESTURES_SHORT.map((g) => (
              <li key={g.k} className="flex items-center gap-3 text-[15px] text-gray-200">
                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] bg-white/10 text-[#FFD23F]">
                  <GestureGlyph name={g.icon} />
                </span>
                <span>
                  <b className="font-bold text-white">{g.k}</b> <span className="text-gray-400">·</span> {g.v}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-[50ch] text-sm leading-relaxed text-gray-400">
            No touch screen? Everything is also on the bot's own web page at <Code dark>vizbot-xxxx.local</Code>.
          </p>
          <div className="mt-[22px]">
            <Btn href="/vizbot/guide#touch" kind="ondark" iconRight={<ArrowRight className="h-4 w-4" />}>
              How to use it
            </Btn>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <LandscapeFrame
            src={SCREENS.s3dock}
            alt="Stackchan's quick dock: two side rails of tiles around the face"
            base
            className="[--sw:250px] sm:[--sw:300px] md:[--sw:330px]"
          />
          <Caption className="mt-3.5">stackchan · the dock as two side rails</Caption>
        </div>
      </div>
    </section>
  );
}

function Boards() {
  return (
    <section className="mt-12 md:mt-16">
      <SectionHeading>pick your bot</SectionHeading>
      <Lead>
        vizBot runs on four boards. Same face, same moods. They differ in screen shape, touch and what else is
        attached.
      </Lead>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {BOARDS.map((b) => (
          <article key={b.id} className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-[18px]">
            <div className="flex items-center gap-3">
              <BoardIcon id={b.id} size={44} />
              <div>
                <p className="text-[15px] font-bold leading-snug text-gray-900">{b.short}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{b.sub}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{b.hint}</p>
            <div className="flex flex-wrap gap-[5px]">
              {b.feats.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
            <VbLink
              href={`/vizbot/releases?board=${b.id}`}
              className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-blue-600 no-underline hover:text-blue-700"
            >
              Download for this board <ArrowRight className="h-[15px] w-[15px]" />
            </VbLink>
          </article>
        ))}
      </div>
    </section>
  );
}

function BigCard({
  href,
  icon,
  title,
  body,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <VbLink
      href={href}
      className="vb-focus flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-[18px] text-[#0a0a0a] no-underline transition-colors hover:border-gray-300 hover:bg-gray-50 md:px-6 md:py-[22px]"
    >
      <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[#FFD23F]">
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

export default function VizBot() {
  return (
    <>
      <SEO
        title="vizBot · a tiny desk robot"
        description="vizBot is open-source firmware that gives a small ESP32 screen a face and a personality: moods, speech bubbles, clock, weather and light shows. Runs on four boards."
        image={SCREENS.home}
        keywords="vizBot, ESP32, desk robot, Stackchan, M5Stack CoreS3, Waveshare, firmware"
      />
      <VizBotShell>
        <Hero />
        <Features />
        <TouchBand />
        <Boards />

        <section className="mt-10 md:mt-12">
          <div className="flex flex-col items-start gap-3.5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 md:flex-row md:items-center md:justify-between md:px-5">
            <p className="text-[15px] leading-relaxed text-gray-700">
              <span className="vb-mono mr-2 text-xs font-medium uppercase tracking-[1px] text-yellow-800">
                new in {DOC_VERSION}
              </span>
              A face-first touch UI: swipe-up dock, scene switcher and full settings on the bot.
            </p>
            <VbLink href="/vizbot/releases#latest" className={`${linkCls} whitespace-nowrap`}>
              Release notes →
            </VbLink>
          </div>
        </section>

        <section className="mt-10 grid gap-3.5 md:mt-12 md:grid-cols-2">
          <BigCard
            href="/vizbot/guide"
            icon={<BookOpen className="h-[22px] w-[22px]" strokeWidth={1.9} />}
            title="User guide"
            body="Get it on your WiFi, learn the gestures, find the web panel, keep it updated, fix the usual snags."
            cta="Open the guide"
          />
          <BigCard
            href="/vizbot/releases"
            icon={<Download className="h-[22px] w-[22px]" strokeWidth={1.9} />}
            title="Downloads"
            body={`Firmware ${DOC_VERSION} for all four boards, with the three steps to install it over WiFi.`}
            cta="Get the firmware"
          />
        </section>
      </VizBotShell>
    </>
  );
}
