import { ChevronDown } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyRadarShell } from "@/components/tinyradar/TinyRadarShell";
import { Bullets, Rows, Shot } from "@/components/labz/bits";
import { Callout, Code, Lead, Rich, SectionHeading, Step, SubHead, VbLink, linkCls } from "@/components/vizbot/bits";
import { DocHero, JumpBar, Toc, sectionCls, useActiveSection } from "@/components/vizbot/docs";
import {
  BUTTON_NOTE,
  BUTTON_ROWS,
  CHANGE_WIFI_NOTE,
  CHANGE_WIFI_STEPS,
  FIXES,
  GUIDE_TOC,
  HOST,
  HOTSPOT,
  HOTSPOT_IP,
  LOCATION_NOTES,
  LOCATION_STEPS,
  LOOKS,
  LOOK_STEPS,
  MAP_CREDIT,
  PAGE_NOTES,
  PAGE_TABS,
  PASTE_NOTE,
  PHOTOS,
  PLUGIN_NOTE,
  PLUGIN_STEPS,
  RESET_NOTE,
  RESET_STEPS,
  SETTINGS_ROWS,
  UPDATE_SAFE,
  UPDATE_STEPS,
  WIFI_SCREEN,
  WIFI_STEPS,
} from "@/content/tinyradar";
import { cn } from "@/lib/utils";

// tinyradar user guide: from the box to the planes, then the web page, the
// button, the looks, updates and fixes. The overview is /tinyradar.
// Layout on vizBot's doc frame: DocHero, sticky Toc, JumpBar.

function Steps({ items }: { items: readonly string[] }) {
  return (
    <div className="grid gap-2.5">
      {items.map((s, i) => (
        <Step key={i} n={i + 1}>
          <Rich text={s} />
        </Step>
      ))}
    </div>
  );
}

/** The round screen's yellow setup screen, in words, as the radar draws it. */
function SetupScreen() {
  return (
    <figure className="m-0">
      <div className="mx-auto grid aspect-square w-full max-w-[240px] place-items-center rounded-full bg-[#FFE000] p-6 text-center text-[#0a0a0a] shadow-[0_0_0_10px_#0e1014,0_0_0_12px_#6b7280]">
        <div className="leading-snug">
          <p className="text-[17px] font-bold">Wi-Fi setup</p>
          <p className="mt-1 text-[13px]">1. Join network:</p>
          <p className="text-[15px] font-bold">{HOTSPOT}</p>
          <p className="mt-1 text-[13px]">2. Open in browser:</p>
          <p className="text-[15px] font-bold">{HOST}</p>
          <p className="text-[12px]">or {HOTSPOT_IP}</p>
        </div>
      </div>
      <figcaption className="vb-mono mt-5 text-center text-xs text-muted-foreground">the round screen, first time</figcaption>
    </figure>
  );
}

function PlugIn() {
  return (
    <section id="plugin" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>plug it in</SectionHeading>
      <Lead>You need the radar, a USB-C cable, a USB charger and your phone.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Steps items={PLUGIN_STEPS} />
          <Callout className="mt-3.5">
            <Rich text={PLUGIN_NOTE} />
          </Callout>
        </div>
        <Shot photo={PHOTOS.hero} caption="the v2 case · render" />
      </div>
    </section>
  );
}

function Wifi() {
  return (
    <section id="wifi" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={2}>Wi-Fi setup</SectionHeading>
      <Lead>The radar makes its own little Wi-Fi network for setup. Your phone joins it for a minute to tell it your home Wi-Fi.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <Steps items={WIFI_STEPS} />
        </div>
        <SetupScreen />
      </div>
      <SubHead>What the round screen says</SubHead>
      <Rows rows={WIFI_SCREEN} cols="sm:grid-cols-[150px_1fr]" />
    </section>
  );
}

function Location() {
  return (
    <section id="location" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>your location and map</SectionHeading>
      <Lead>The radar needs to know where it is. This happens on its web page, from any phone or laptop on your Wi-Fi.</Lead>
      <Steps items={LOCATION_STEPS} />
      <Callout className="mt-3.5">
        <Rich text={PASTE_NOTE} />
      </Callout>
      <Bullets className="mt-5" items={LOCATION_NOTES} />
    </section>
  );
}

function Page() {
  return (
    <section id="page" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>the web page</SectionHeading>
      <Lead>
        <Code>http://{HOST}</Code> is the radar's own page. It runs on the radar, so it only opens on the same Wi-Fi.
      </Lead>
      <Rows rows={PAGE_TABS} cols="sm:grid-cols-[110px_1fr]" />
      <SubHead>Settings</SubHead>
      <Rows rows={SETTINGS_ROWS} cols="sm:grid-cols-[150px_1fr]" />
      <Bullets className="mt-5" items={PAGE_NOTES} />
    </section>
  );
}

function Button() {
  return (
    <section id="button" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={5}>the range button</SectionHeading>
      <Lead>The red button on the deck. It decides how far the radar looks.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Rows rows={BUTTON_ROWS} cols="sm:grid-cols-[150px_1fr]" />
          <Callout className="mt-3.5">
            <Rich text={BUTTON_NOTE} />
          </Callout>
        </div>
        <Shot photo={PHOTOS.button} caption="the button's spot in the deck · render" />
      </div>
    </section>
  );
}

function Looks() {
  return (
    <section id="looks" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={6}>looks</SectionHeading>
      <Lead>Seven of them. Day and Dusk put your map under the planes. The other five are classic radar screens.</Lead>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {LOOKS.map((l) => (
          <li key={l.name} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
            <span
              className="mx-auto block aspect-square w-full max-w-[84px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${l.plane} 0 5%, transparent 6%), radial-gradient(circle, transparent 46%, ${l.ring} 47% 49%, transparent 50%), ${
                  l.water ? `linear-gradient(160deg, transparent 58%, ${l.water} 59% 72%, transparent 73%), ` : ""
                }${l.bg}`,
                boxShadow: "0 0 0 1.5px #0a0a0a",
              }}
              aria-hidden="true"
            />
            <span className="mt-2 block text-[14px] font-bold text-gray-900">{l.name}</span>
            <span className="block text-[12px] text-muted-foreground">{l.note}</span>
          </li>
        ))}
      </ul>
      <SubHead>Change it</SubHead>
      <Steps items={LOOK_STEPS} />
      <p className="mt-3.5 text-[13px] text-muted-foreground">{MAP_CREDIT}</p>
    </section>
  );
}

function Update() {
  return (
    <section id="update" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={7}>updates</SectionHeading>
      <Lead>
        New versions install from the radar's web page, over Wi-Fi. What's new is on{" "}
        <VbLink href="/tinyradar/update" className={linkCls}>
          the updates page
        </VbLink>
        .
      </Lead>
      <Steps items={UPDATE_STEPS} />
      <SubHead>If something goes wrong</SubHead>
      <Bullets items={UPDATE_SAFE} />
    </section>
  );
}

function Help() {
  return (
    <section id="help" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={8}>if something's off</SectionHeading>
      <Lead>What usually goes wrong, and what to do about it.</Lead>
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

function Reset() {
  return (
    <section id="reset" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={9}>change Wi-Fi or start over</SectionHeading>
      <Lead>Both are in the radar's Settings. Neither needs a cable or a button inside the case.</Lead>
      <SubHead>Change Wi-Fi</SubHead>
      <Steps items={CHANGE_WIFI_STEPS} />
      <Callout className="mt-3.5">
        <Rich text={CHANGE_WIFI_NOTE} />
      </Callout>
      <SubHead>Factory reset</SubHead>
      <Steps items={RESET_STEPS} />
      <Callout className="mt-3.5">
        <Rich text={RESET_NOTE} />
      </Callout>
    </section>
  );
}

export default function TinyRadarGuide() {
  const active = useActiveSection(GUIDE_TOC);
  useHashScroll();

  return (
    <>
      <SEO />
      <TinyRadarShell>
        <DocHero
          eyebrow="user guide · tinyradar"
          title="From the box to the planes."
          lead={
            <>
              Plugging it in, Wi-Fi from your phone, telling it where it is, and everything on its web page. The
              overview is on <span className="vb-mono text-[.92em]">/tinyradar</span>.
            </>
          }
          quick={[
            { t: "Wi-Fi setup", d: "Join TinyRadar-Setup from your phone.", href: "wifi", n: 2 },
            { t: "Your location", d: "Find your town, draw the map.", href: "location", n: 3 },
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
              <VbLink
                href="/tinyradar/update"
                className="mt-3 flex items-center gap-2 px-2 py-1 text-[13px] text-gray-600 no-underline hover:text-gray-900"
              >
                Updates and downloads
              </VbLink>
            }
          />
          <div className="min-w-0">
            <PlugIn />
            <Wifi />
            <Location />
            <Page />
            <Button />
            <Looks />
            <Update />
            <Help />
            <Reset />
          </div>
        </div>
      </TinyRadarShell>
    </>
  );
}
