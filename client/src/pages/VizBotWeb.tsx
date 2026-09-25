import { useState } from "react";
import { SEO } from "@/components/global/SEO";
import { VizBotShell, useHashScroll } from "@/components/vizbot/VizBotShell";
import { Callout, Caption, Lead, Rich, SectionHeading, Step } from "@/components/vizbot/bits";
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
  DOC_VERSION,
  WEB_FULL,
  WEB_LAYOUT,
  WEB_OPEN_STEPS,
  WEB_SECTIONS,
  type BoardId,
  type TocItem,
  type WebSection,
} from "@/content/vizbot";
import { cn } from "@/lib/utils";

// vizBot web panel: how to open it, then one section per card in the panel's
// own order, each with a real screenshot and every control explained.

const WEB_TOC: TocItem[] = [
  { id: "open", name: "open it" },
  ...WEB_SECTIONS.map((s) => ({ id: s.id, name: s.name, boards: s.boards })),
];

const applies = (f: Filter, boards?: BoardId[]) => f === "all" || !boards || boards.includes(f);

/** A panel screenshot (2x) on the panel's own beige, never scaled past 1x. Opens full size. */
function PanelShot({ src, w, h, alt, eager = false }: { src: string; w: number; h: number; alt: string; eager?: boolean }) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      title="Open full size"
      className="vb-focus block w-full rounded-xl border border-gray-200 bg-[#e8e4dc] p-2 shadow-[0_1px_2px_rgba(0,0,0,.05)] hover:border-gray-300 sm:p-3"
      style={{ maxWidth: w / 2 + 26 }}
    >
      <img
        src={src}
        width={w / 2}
        height={h / 2}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="block h-auto w-full"
      />
    </a>
  );
}

function Open() {
  return (
    <section id="open" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>open it</SectionHeading>
      <Lead>The bot serves its own web page. Anything on the same WiFi can open it.</Lead>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="grid gap-2.5">
            {WEB_OPEN_STEPS.map((s, i) => (
              <Step key={i} n={i + 1}>
                <Rich text={s} />
              </Step>
            ))}
          </div>
          <ul className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {WEB_LAYOUT.map((l, i) => (
              <li
                key={i}
                className={cn(
                  "px-4 py-3 text-[14.5px] leading-relaxed text-gray-700",
                  i < WEB_LAYOUT.length - 1 && "border-b border-gray-200",
                )}
              >
                <Rich text={l} />
              </li>
            ))}
          </ul>
        </div>
        <figure className="mx-auto w-full max-w-[420px] lg:max-w-none">
          <PanelShot src={WEB_FULL.src} w={WEB_FULL.w} h={WEB_FULL.h} alt="The whole web panel on a Stackchan" eager />
          <Caption dark={false}>stackchan · tap for full size</Caption>
        </figure>
      </div>
    </section>
  );
}

function Controls({ s, filter }: { s: WebSection; filter: Filter }) {
  const rows = s.controls.filter((c) => applies(filter, c.boards));
  if (!rows.length) return null;
  return (
    <dl className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {rows.map((c, i) => (
        <div key={c.k} className={cn("px-4 py-3", i < rows.length - 1 && "border-b border-gray-200")}>
          <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14.5px] font-bold text-gray-900">
            {c.k}
            {c.boards && filter === "all" && (
              <span className="vb-mono rounded-md border border-gray-200 bg-gray-100 px-[7px] py-0.5 text-[11px] font-normal text-gray-700">
                {c.boards.map((b) => BOARD_BY_ID[b].short.replace("M5Stack ", "")).join(" · ")}
              </span>
            )}
          </dt>
          <dd className="mt-0.5 text-sm leading-relaxed text-gray-700">
            <Rich text={c.v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PanelCard({ s, num, filter }: { s: WebSection; num: number; filter: Filter }) {
  // Short, wide cards (Expressions, Say, Personality) read best stacked at full
  // width. Taller ones sit beside their controls on desktop.
  const wide = s.h / s.w < 0.4;
  const shot = <PanelShot src={s.shot} w={s.w} h={s.h} alt={`The ${s.card} card in the web panel`} />;
  const body = (
    <div className="grid gap-3.5">
      <Controls s={s} filter={filter} />
      {s.note && (
        <Callout>
          <Rich text={s.note} />
        </Callout>
      )}
    </div>
  );
  return (
    <section id={s.id} className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={num}>{s.name}</SectionHeading>
      {s.boards && <Applies boards={s.boards.map((b) => BOARD_BY_ID[b].short.replace("M5Stack ", ""))} />}
      <Lead>
        <Rich text={s.lead} />
      </Lead>
      {wide ? (
        <div className="grid gap-4">
          {shot}
          {body}
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-7">
          <div className="lg:sticky lg:top-24">{shot}</div>
          {body}
        </div>
      )}
    </section>
  );
}

export default function VizBotWeb() {
  const [filter, setFilter] = useState<Filter>("all");
  const items = visibleToc(WEB_TOC, filter);
  const active = useActiveSection(items, filter);
  useHashScroll();
  const numOf = (id: string) => items.findIndex((t) => t.id === id) + 1;

  return (
    <>
      <SEO
        title="vizBot web panel"
        description="Every card on vizBot's web panel with screenshots: expressions, personality, appearance, WLED sprites, device, sounds, weather, WiFi, WLED display and Stackchan head control."
        image={WEB_FULL.src}
        keywords="vizBot, web panel, WLED, ESP32, Stackchan, CoreS3, hologram, kaleidoscope"
      />
      <VizBotShell>
        <DocHero
          eyebrow={`web panel · firmware ${DOC_VERSION}`}
          title="The web panel."
          lead="The bot's own web page. It does everything the touch screen does, plus the stuff that needs typing. Here's every card and what each control does."
          quick={[
            { t: "Can't find it?", d: "Open it by name or IP.", href: "open", n: 1 },
            { t: "Got a WLED matrix?", d: "Speech, sprites, scheduled weather.", href: "wled", n: numOf("wled") },
            filter === "all" || filter === "stackchan"
              ? { t: "Got a Stackchan?", d: "Head, base LEDs, power off.", href: "stackchan", n: numOf("stackchan") }
              : { t: "Changing WiFi?", d: "Rename, scan, forget.", href: "wifi", n: numOf("wifi") },
          ]}
        />
        <JumpBar items={items} active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc items={items} active={active} label="Web panel sections">
            <FilterBox value={filter} onChange={setFilter} />
          </Toc>
          <div className="min-w-0">
            <FilterBanner filter={filter} setFilter={setFilter} name={filter === "all" ? "" : BOARD_BY_ID[filter].short} />
            <Open />
            {WEB_SECTIONS.filter((s) => applies(filter, s.boards)).map((s) => (
              <PanelCard key={s.id} s={s} num={numOf(s.id)} filter={filter} />
            ))}
          </div>
        </div>
      </VizBotShell>
    </>
  );
}
