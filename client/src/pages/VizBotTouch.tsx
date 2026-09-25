import { useState } from "react";
import { SEO } from "@/components/global/SEO";
import { VizBotShell, useHashScroll } from "@/components/vizbot/VizBotShell";
import { DinoFrame, LandscapeFrame } from "@/components/vizbot/frames";
import { GestureGlyph } from "@/components/vizbot/icons";
import { Callout, Caption, Lead, SectionHeading, VbLink, linkCls } from "@/components/vizbot/bits";
import {
  Applies,
  DocHero,
  FilterBanner,
  FilterBox,
  JumpBar,
  Toc,
  sectionCls,
  useActiveSection,
  visibleToc,
  type Filter,
} from "@/components/vizbot/docs";
import {
  BOARD_BY_ID,
  CAT,
  DOCK_TILES,
  DOC_VERSION,
  GESTURES,
  LANDSCAPE_SHOTS,
  SCREENS,
  SETTINGS,
  SHEETS,
  TOUCH_TOC,
  type BoardId,
} from "@/content/vizbot";
import { cn } from "@/lib/utils";

// vizBot touch screen: gestures, the dock, the sheets, settings, and the
// landscape layout on CoreS3 / Stackchan. Same frame as the guide.

const TOUCH_BOARDS: BoardId[] = ["lcd169", "cores3", "stackchan"];

function Gestures() {
  return (
    <section id="gestures" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>gestures</SectionHeading>
      <Lead>Five moves. They work the same on every touch board.</Lead>
      <div className="grid items-center gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="hidden justify-center lg:flex">
          <DinoFrame src={SCREENS.home} alt="The home face" className="[--sw:176px]" />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {GESTURES.map((g, i) => (
            <div
              key={g.k}
              className={cn(
                "flex items-start gap-3 px-3.5 py-3 md:grid md:grid-cols-[230px_1fr] md:items-center md:gap-4 md:px-[18px]",
                i < GESTURES.length - 1 && "border-b border-gray-200",
              )}
            >
              <span className="flex items-center gap-3 text-sm font-bold text-gray-900">
                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] border border-yellow-200 bg-yellow-50 text-yellow-800">
                  <GestureGlyph name={g.icon} size={19} />
                </span>
                <span className="hidden md:inline">{g.k}</span>
              </span>
              <span className="block">
                <span className="block text-sm font-bold text-gray-900 md:hidden">{g.k}</span>
                <span className="mt-0.5 block text-sm leading-normal text-gray-700 md:mt-0 md:text-[14.5px]">{g.v}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dock() {
  return (
    <section id="dock" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={2}>the quick dock</SectionHeading>
      <div className="mt-5 grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          <p className="mb-3.5 text-[15px] leading-relaxed text-gray-700">
            Swipe up or press and hold. The face shrinks to the top and six tiles come up. The pill at the top shows the
            bot's address for when you forget it.
          </p>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#12171D] p-2.5">
            {DOCK_TILES.map((t) => (
              <div key={t.name} className="flex items-center gap-2.5 rounded-[10px] bg-[#1E252E] px-3 py-2.5">
                <span className="h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: CAT[t.cat] }} />
                <span className="text-sm font-medium text-white">{t.name}</span>
                <span className="ml-auto hidden text-right text-[13px] text-[#8C99A8] sm:inline">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <DinoFrame src={SCREENS.dock} alt="The quick dock on the 1.69" className="[--sw:160px] lg:[--sw:176px]" />
        </div>
      </div>
    </section>
  );
}

function Sheets() {
  return (
    <section id="sheets" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>scene, mood, light</SectionHeading>
      <Lead>
        Scene, Mood and Light open a sheet over the bottom half. The face stays live above it so you can see the change.
      </Lead>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2.5 pt-1 md:mx-0 md:grid md:grid-cols-3 md:gap-[18px] md:overflow-visible md:p-0">
        {SHEETS.map((s) => (
          <div key={s.name} className="w-[236px] flex-none snap-start md:w-auto">
            <div className="flex justify-center rounded-[10px] bg-[#0e1014] pb-3.5 pt-4">
              <DinoFrame src={SCREENS[s.screen]} alt={`The ${s.name} sheet`} className="[--sw:136px] md:[--sw:150px]" />
            </div>
            <p className="mb-1 mt-3 text-[15px] font-bold text-gray-900">{s.name}</p>
            <p className="text-sm leading-normal text-gray-700">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Settings() {
  return (
    <section id="settings" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>settings</SectionHeading>
      <Lead>
        Tap <b className="font-bold text-gray-900">More</b> in the dock. Six pages, same colors as the dock tiles.
      </Lead>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_410px]">
        <div className="order-2 overflow-hidden rounded-xl border border-gray-200 bg-white lg:order-1">
          {SETTINGS.map((s, i) => (
            <div
              key={s.name}
              className={cn(
                "px-3.5 py-[11px] md:grid md:grid-cols-[120px_1fr] md:gap-3 md:px-4",
                i < SETTINGS.length - 1 && "border-b border-gray-200",
              )}
            >
              <span className="inline-flex items-center gap-[7px] whitespace-nowrap text-[13px] font-medium text-gray-900">
                <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: CAT[s.cat] }} />
                {s.name}
              </span>
              <p className="ml-4 mt-[3px] text-[13.5px] leading-normal text-gray-700 md:ml-0 md:mt-0 md:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="order-1 flex justify-center gap-2 overflow-hidden rounded-xl bg-[#0e1014] px-1 py-[18px] sm:gap-3.5 md:px-3 md:py-[22px] lg:order-2">
          <DinoFrame src={SCREENS.settings} alt="The settings page" className="[--sw:112px] sm:[--sw:140px] md:[--sw:150px]" />
          <DinoFrame src={SCREENS.look} alt="Settings › Look" className="[--sw:112px] sm:[--sw:140px] md:[--sw:150px]" />
        </div>
      </div>
    </section>
  );
}

function Landscape({ filter }: { filter: Filter }) {
  const shots = LANDSCAPE_SHOTS.filter((s) => filter === "all" || s.boards.includes(filter as BoardId));
  return (
    <section id="landscape" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={5}>CoreS3 and Stackchan</SectionHeading>
      <Applies boards={["CoreS3", "Stackchan"]} />
      <Lead className="mt-4">
        Same gestures, turned sideways. The face stays full size and the dock becomes two rails. It adds{" "}
        <b className="font-bold text-gray-900">Sound</b>, plus <b className="font-bold text-gray-900">Head</b> on a
        Stackchan or <b className="font-bold text-gray-900">Connect</b> on a plain CoreS3. Settings get a category list
        on the left.
      </Lead>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2.5 pt-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:p-0 xl:grid-cols-3">
        {shots.map((s) => (
          <div key={s.screen} className="w-[262px] flex-none snap-start md:w-auto">
            <div className="flex flex-col items-center rounded-[10px] bg-[#0e1014] px-2 pb-3 pt-4">
              <LandscapeFrame src={SCREENS[s.screen]} alt={s.caption} className="[--sw:226px]" />
              <Caption className="mt-2.5">{s.caption}</Caption>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function VizBotTouch() {
  const [filter, setFilter] = useState<Filter>("all");
  const items = visibleToc(TOUCH_TOC, filter);
  const active = useActiveSection(items, filter);
  useHashScroll();

  return (
    <>
      <SEO
        title="vizBot touch screen"
        description="How to drive vizBot from its touch screen: gestures, the quick dock, the scene, mood and light sheets, settings, and the CoreS3 and Stackchan layout."
        image={SCREENS.dock}
        keywords="vizBot, touch screen, gestures, ESP32, Stackchan, CoreS3, Waveshare 1.69"
      />
      <VizBotShell>
        <DocHero
          eyebrow={`touch screen · firmware ${DOC_VERSION}`}
          title="Swipe, tap, hold."
          lead="The face gets the whole screen. Everything else is one gesture away, and every setting lives on the bot itself."
          quick={[
            { t: "Gestures", d: "Five moves to learn.", href: "gestures", n: 1 },
            { t: "The dock", d: "Swipe up for six tiles.", href: "dock", n: 2 },
            { t: "Settings", d: "Six pages under More.", href: "settings", n: 4 },
          ]}
        />
        <JumpBar items={items} active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc items={items} active={active} label="Touch screen sections">
            <FilterBox value={filter} onChange={setFilter} boards={TOUCH_BOARDS} />
          </Toc>
          <div className="min-w-0">
            <FilterBanner filter={filter} setFilter={setFilter} name={filter === "all" ? "" : BOARD_BY_ID[filter].short} />
            <Applies boards={["1.69", "CoreS3", "Stackchan"]} className="mt-6 lg:mt-9" />
            <Callout className="mt-3">
              Got a 1.3? It has no touch screen. Everything here is in the{" "}
              <VbLink href="/vizbot/web" className={linkCls}>
                web panel
              </VbLink>{" "}
              too.
            </Callout>
            <Gestures />
            <Dock />
            <Sheets />
            <Settings />
            {filter !== "lcd169" && <Landscape filter={filter} />}
          </div>
        </div>
      </VizBotShell>
    </>
  );
}
