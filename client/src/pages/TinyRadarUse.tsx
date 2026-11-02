import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyRadarShell } from "@/components/tinyradar/TinyRadarShell";
import { Callout, Rich, VbLink, linkCls } from "@/components/vizbot/bits";
import { JumpBar, useActiveSection } from "@/components/vizbot/docs";
import { Crumb, GuideHero, GuideSection, Media, MiniSteps, NextCards, Num, OnThisPage, Shot, SubHead } from "@/components/tinyradar/kit/bits";
import { RingDevice, Scope } from "@/components/tinyradar/kit/RingDevice";
import { RoundScreen } from "@/components/tinyradar/kit/RoundScreen";
import { AlertCards, LineItUp, RingPlayground } from "@/components/tinyradar/kit/RingPlayground";
import { lookOf } from "@/components/tinyradar/kit/looks";
import { useMedia } from "@/components/tinyradar/kit/motion";
import {
  BUTTON_NOTE,
  BUTTON_ROWS,
  CAPTURES,
  HEIGHT_BANDS,
  LINEUP_STEPS,
  LOOKS,
  LOOKS_NOTE,
  MAP_CREDIT,
  RANGE_FRAMES,
  READING_MARKS,
  RING_COLOURS_NOTE,
  SETTINGS_MARKS,
  SETTINGS_MORE,
  TAB_ROWS,
  USE_TOC,
} from "@/content/tinyradar";
import "@/components/tinyradar/kit/kit.css";

// tinyradar, part 2 of the guide: make it yours. Reading the screen, the range
// button, looks, the light ring (new in 1.1.0) and the radar's web page.
// Setup is /tinyradar/guide, fixes are /tinyradar/help.

function Reading() {
  const narrow = useMedia("(max-width: 767px)");
  const size = narrow ? 300 : 360;
  return (
    <GuideSection id="reading" num={1} title="reading the screen" lead="North is up and your home is the dot in the middle. Everything else is a plane.">
      <div className="grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
        <figure className="m-0 justify-self-center">
          <div className="tr-card tr-dark relative p-4 sm:p-5">
            <div className="relative" style={{ width: size, height: size }}>
              <Scope
                size={size}
                look={lookOf("Day")}
                sky={{ labels: true, ringLabel: "9 mi", rim: true, runway: true }}
                label="The round screen in the Day look: planes with call signs, type and height, coloured by height, rings, a runway and dots on the rim"
              />
              {READING_MARKS.map((m) => (
                <span key={m.n} className="tr-mark" style={{ left: `${m.x}%`, top: `${m.y}%` }} aria-hidden="true">
                  {m.n}
                </span>
              ))}
            </div>
          </div>
          <figcaption className="vb-mono mt-2 text-center text-[11.5px] text-gray-500">the Day look, with a made-up town</figcaption>
        </figure>
        <div className="min-w-0">
          <ol className="m-0 grid list-none gap-3 p-0">
            {READING_MARKS.map((m) => (
              <li key={m.n} className="flex items-start gap-3">
                <Num n={m.n} sm />
                <span className="pt-[2px] text-[15px] leading-normal text-gray-700">
                  <b className="text-gray-900">{m.k}.</b> {m.v}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl bg-[#0e1014] p-4 text-white">
            <p className="vb-mono mb-2.5 text-[11px] font-medium uppercase tracking-[1.2px] text-[#1DFF86]">height, in the map looks</p>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-1.5 p-0 sm:grid-cols-3">
              {HEIGHT_BANDS.map((b) => (
                <li key={b.c} className="flex items-center gap-2 text-[13px] text-gray-200">
                  <span className="h-3 w-3 flex-none rounded-sm" style={{ background: b.c }} aria-hidden="true" />
                  {b.l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </GuideSection>
  );
}

function Button() {
  const [press, hold] = BUTTON_ROWS;
  return (
    <GuideSection id="button" num={2} title="the range button" lead="The green button on the deck decides how far the radar looks.">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
        <figure className="tr-shot m-0">
          <div className="relative overflow-hidden rounded-2xl border-[1.5px] border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a]">
            <img src={CAPTURES.deck.src} width={CAPTURES.deck.w} height={CAPTURES.deck.h} alt={CAPTURES.deck.alt} loading="lazy" className="block h-auto w-full !rounded-none !border-0" />
            <span className="absolute left-[25.3%] top-[30.7%] h-[22%] w-[17%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#1DFF86] shadow-[0_0_0_2px_#0a0a0a]" aria-hidden="true" />
            <span className="vb-mono absolute left-[25.3%] top-[52%] -translate-x-1/2 rounded-md bg-[#0a0a0a] px-2 py-0.5 text-[11px] font-bold text-[#1DFF86]">
              range
            </span>
          </div>
          <figcaption>the deck: the range button, then the keyboard</figcaption>
        </figure>
        <div className="min-w-0">
          <div className="tr-card p-4">
            <p className="m-0 mb-3 text-[15px] text-gray-700">
              <b className="text-gray-900">{press.k}:</b> {press.v}
            </p>
            <div className="flex items-end justify-between gap-2">
              {RANGE_FRAMES.map((f) => (
                <figure key={f.label} className="m-0 grid justify-items-center gap-1.5">
                  <Scope size={88} sky={{ zoom: f.zoom }} label={`The screen at the ${f.label} range: ${f.ring} on the third ring`} />
                  <figcaption className="vb-mono text-[11px] text-gray-500">
                    {f.label} · {f.ring}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="tr-card mt-3.5 flex items-center gap-4 p-4">
            <RoundScreen kind="online" size={72} />
            <p className="m-0 text-[15px] text-gray-700">
              <b className="text-gray-900">{hold.k}:</b> {hold.v}
            </p>
          </div>
          <Callout className="mt-3.5">
            <Rich text={BUTTON_NOTE} />
          </Callout>
        </div>
      </div>
    </GuideSection>
  );
}

function Looks() {
  return (
    <GuideSection id="looks" num={3} title="looks" lead="Seven of them. Day and Dusk put your map under the planes. The other five are classic radar screens.">
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-7">
        {LOOKS.map((l) => (
          <li key={l.name} className="tr-card grid justify-items-center gap-1 p-3 text-center">
            <Scope size={92} look={lookOf(l.name)} sky={{}} label={`The ${l.name} look`} />
            <b className="mt-1.5 text-[14px] text-gray-900">{l.name}</b>
            <span className="text-[12px] text-gray-500">{l.note}</span>
          </li>
        ))}
      </ul>
      <p className="vb-mono mt-2 text-[11.5px] text-gray-500">drawn here with a made-up town; on yours it's your map</p>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <div className="min-w-0">
          <SubHead className="!mt-0">Change it</SubHead>
          <p className="m-0 text-[15px] leading-relaxed text-gray-700">
            <Crumb path={["Settings", "Radar screen", "Look"]} />. Tap one: the round screen changes in a second or two.
          </p>
          <Callout className="mt-4">
            <Rich text={LOOKS_NOTE} />
          </Callout>
          <p className="mt-3 text-[13px] text-muted-foreground">{MAP_CREDIT}</p>
        </div>
        <Shot img={CAPTURES.looks} caption="Settings › Radar screen › Look" className="mx-auto w-full max-w-[280px]" />
      </div>
    </GuideSection>
  );
}

function Ring() {
  return (
    <GuideSection
      id="ring"
      num={4}
      title="light ring"
      badge="NEW · v1.1.0"
      lead="Eight lights round the screen. They can follow the sweep, point at planes, or just glow. Try it here: this is the radar's own effect code."
    >
      <RingPlayground />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Media id="ringBeam" ratio={null} className="aspect-[3/1] sm:aspect-[16/10]" />
        <Media id="ringRadarFx" ratio={null} className="aspect-[3/1] sm:aspect-[16/10]" />
        <Media id="ringAmbient" ratio={null} className="aspect-[3/1] sm:aspect-[16/10]" />
      </div>

      <SubHead>On your phone</SubHead>
      <p className="m-0 mb-3 max-w-[640px] text-[15px] text-gray-700">
        <Crumb path={["Settings", "Light ring"]} />. Changes show on the ring in a second. {RING_COLOURS_NOTE}
      </p>
      <div className="tr-shots">
        <Shot img={CAPTURES.ringTop} caption="1 · on/off and brightness" />
        <Shot img={CAPTURES.ringEffect} caption="2 · effect and speed" />
        <Shot img={CAPTURES.ringColours} caption="3 · colours" />
      </div>

      <SubHead>Alerts</SubHead>
      <AlertCards />

      <SubHead id="line-it-up">Line it up</SubHead>
      <div className="mb-4 max-w-[640px]">
        <p className="m-0 mb-2.5 text-[15px] text-gray-700">
          The ring can sit in the case turned any way. If Beam's light doesn't ride with the sweep on the screen:
        </p>
        <MiniSteps items={LINEUP_STEPS} />
      </div>
      <LineItUp />
    </GuideSection>
  );
}

function WebPage() {
  return (
    <GuideSection
      id="page"
      num={5}
      title="the web page"
      lead={
        <>
          <span className="vb-mono">tinyradar.local</span> is the radar's own page. It runs on the radar, so it opens on the same Wi-Fi only.
        </>
      }
    >
      <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-[300px]">
          <Shot img={CAPTURES.settings} caption="Settings, on a phone">
            {SETTINGS_MARKS.map((m) => (
              <span key={m.n} className="tr-mark" style={{ left: "3.5%", top: `${m.y}%` }} aria-hidden="true">
                {m.n}
              </span>
            ))}
          </Shot>
        </div>
        <div className="min-w-0">
          <SubHead className="!mt-0">Four tabs</SubHead>
          <img src={CAPTURES.tabs.src} width={CAPTURES.tabs.w} height={CAPTURES.tabs.h} alt={CAPTURES.tabs.alt} loading="lazy" className="block h-auto w-full max-w-[420px] rounded-xl border-[1.5px] border-[#0a0a0a] bg-[#030605]" />
          <dl className="m-0 mt-3 grid gap-1.5 sm:grid-cols-2">
            {TAB_ROWS.map((r) => (
              <div key={r.k} className="text-[14.5px] text-gray-700">
                <dt className="inline font-bold text-gray-900">{r.k}: </dt>
                <dd className="m-0 inline">{r.v}</dd>
              </div>
            ))}
          </dl>
          <SubHead>Settings</SubHead>
          <ol className="m-0 grid list-none gap-2.5 p-0">
            {SETTINGS_MARKS.map((m) => (
              <li key={m.n} className="flex items-start gap-3">
                <Num n={m.n} sm />
                <span className="pt-[2px] text-[15px] leading-normal text-gray-700">
                  <b className="text-gray-900">{m.k}</b>
                  {m.dot ? <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-[#B69CFF] align-middle" title="Changes your radar" /> : null} {m.v}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[14.5px] leading-relaxed text-gray-700">
            <Rich text={SETTINGS_MORE} />
          </p>
          <Callout className="mt-3">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#B69CFF] align-middle" aria-hidden="true" /> A purple dot means the setting
            changes your radar itself. The rest change only the browser you're using.
          </Callout>
        </div>
      </div>
    </GuideSection>
  );
}

export default function TinyRadarUse() {
  useHashScroll();
  const active = useActiveSection(USE_TOC);
  return (
    <>
      <SEO />
      <TinyRadarShell>
        <GuideHero
          eyebrow="make it yours · tinyradar"
          title="Make it yours."
          lead={
            <>
              What the screen is telling you, how far it looks, its seven looks, the light ring and its web page. Not set up yet?{" "}
              <VbLink href="/tinyradar/guide" className={linkCls}>
                Start here
              </VbLink>
              .
            </>
          }
          aside={
            <div className="hidden lg:block">
              <RingDevice size={120} ring={{ fx: "Pings", pal: "Radar" }} />
            </div>
          }
        />
        <OnThisPage items={USE_TOC} />
        <JumpBar items={USE_TOC} active={active} />
        <Reading />
        <Button />
        <Looks />
        <Ring />
        <WebPage />
        <section className="mt-16 md:mt-20">
          <NextCards
            cards={[
              { href: "/tinyradar/help", t: "Something's off?", d: "Short answers to what usually goes wrong." },
              { href: "/tinyradar/update", t: "Updates", d: "The newest version and how to install it." },
              { href: "/tinyradar/guide", t: "Set it up", d: "Plug in, Wi-Fi, location." },
            ]}
          />
        </section>
      </TinyRadarShell>
    </>
  );
}
