import { useState, type ReactNode } from "react";
import { ArrowRight, Code2, ChevronDown } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { VizBotShell, useHashScroll } from "@/components/vizbot/VizBotShell";
import { DinoFrame, LandscapeFrame } from "@/components/vizbot/frames";
import { BoardIcon } from "@/components/vizbot/icons";
import { FilenameAnatomy, TokenList } from "@/components/vizbot/files";
import {
  Btn,
  Callout,
  Code,
  Lead,
  Rich,
  SectionHeading,
  Step,
  VbLink,
  linkCls,
} from "@/components/vizbot/bits";
import {
  BoardSelect,
  DocHero,
  FilterBanner,
  FilterBox,
  JumpBar,
  Toc,
  sectionCls,
  useActiveSection,
  type Filter,
} from "@/components/vizbot/docs";
import {
  BOARDS,
  BOARD_BY_ID,
  DOC_VERSION,
  FIXES,
  ISSUES_URL,
  SCREENS,
  SETUP_STEPS,
  TOC,
  UPDATE_STEPS,
  WEB_FULL,
  otaFileName,
  type BoardId,
} from "@/content/vizbot";
import { cn } from "@/lib/utils";

// vizBot user guide. Copy and layout from the comps (GuideDesktop / GuideMobile).
// Desktop: sticky TOC with the section in view highlighted. Phones: a sticky
// "Jump to" select under the site header. "Show notes for" hides what doesn't
// apply to one board. The touch screen and the web panel have their own pages
// (/vizbot/touch, /vizbot/web); here they are pointer cards that keep the old
// #touch and #web anchors alive.

function Setup() {
  return (
    <section id="setup" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>get it online</SectionHeading>
      <Lead>You need the bot, a phone and your WiFi. Takes about 5 minutes.</Lead>
      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          <div className="grid gap-2.5">
            {SETUP_STEPS.map((s, i) => (
              <Step key={i} n={i + 1}>
                <Rich text={s} />
              </Step>
            ))}
          </div>
          <Callout kind="warn" className="mt-4">
            <b className="font-bold text-gray-900">2.4 GHz only.</b> The ESP32-S3 has no 5 GHz radio. If your router
            splits the bands into two names, pick the 2.4 one.
          </Callout>
          <Callout className="mt-2.5">
            <b className="font-bold text-gray-900">Name it.</b> In the{" "}
            <VbLink href="/vizbot/web#wifi" className={linkCls}>
              web panel
            </VbLink>
            , set the device name to something like <Code>vizbot-desk</Code>. After a restart it's at{" "}
            <Code>vizbot-desk.local</Code>.
          </Callout>
        </div>
        <div className="hidden flex-col items-center lg:flex">
          <DinoFrame src={SCREENS.connect} alt="Settings › Connect showing network, address and IP" className="[--sw:176px]" />
          <p className="mt-3.5 max-w-[30ch] text-center text-[13px] leading-normal text-muted-foreground">
            <b className="font-bold text-gray-900">Settings › Connect</b> shows the address and IP once it's online.
            Offline it shows the hotspot steps.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pointer({
  href,
  title,
  body,
  cta,
  art,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  art: ReactNode;
}) {
  return (
    <VbLink
      href={href}
      className="vb-focus group mt-5 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white no-underline hover:border-gray-300 sm:flex-row"
    >
      <div className="flex flex-none items-center justify-center bg-[#0e1014] px-4 py-5 sm:w-[240px]">{art}</div>
      <div className="flex flex-col justify-center gap-2 px-5 py-4">
        <p className="text-[16px] font-bold text-gray-900">{title}</p>
        <p className="text-sm leading-relaxed text-gray-700">{body}</p>
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 group-hover:text-blue-700">
          {cta} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </VbLink>
  );
}

function Touch({ filter }: { filter: Filter }) {
  return (
    <section id="touch" className={cn("mt-12 md:mt-14", sectionCls)}>
      <SectionHeading num={2}>the touch screen</SectionHeading>
      {filter === "lcd13" ? (
        <Callout className="mt-5">
          The 1.3 has no touch screen. Use the{" "}
          <VbLink href="/vizbot/web" className={linkCls}>
            web panel
          </VbLink>
          .
        </Callout>
      ) : (
        <Pointer
          href="/vizbot/touch"
          title="It has its own page now."
          body="Gestures, the quick dock, the scene, mood and light sheets, all six settings pages, and the sideways layout on CoreS3 and Stackchan."
          cta="Open the touch screen page"
          art={
            filter === "cores3" || filter === "stackchan" ? (
              <LandscapeFrame src={SCREENS.s3dock} alt="The quick dock on a Stackchan" className="[--sw:180px]" />
            ) : (
              <DinoFrame src={SCREENS.dock} alt="The quick dock on the 1.69" className="[--sw:104px]" />
            )
          }
        />
      )}
    </section>
  );
}

function WebPanel() {
  return (
    <section id="web" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>the web panel</SectionHeading>
      <Lead>
        Open <Code>http://vizbot-xxxx.local</Code> from anything on the same WiFi. It does everything the touch screen
        does, plus the stuff that needs typing.
      </Lead>
      <Pointer
        href="/vizbot/web"
        title="Every card, with screenshots."
        body="Expressions, personality, appearance, WLED sprites, device, sounds, weather, WiFi, the WLED display and Stackchan head control. What each control does and which boards have it."
        cta="Open the web panel page"
        art={
          <img
            src={WEB_FULL.src}
            width={170}
            height={224}
            alt="The vizBot web panel"
            loading="lazy"
            className="block h-auto w-[150px] rounded-md bg-[#e8e4dc] sm:w-[170px]"
          />
        }
      />
    </section>
  );
}

function Update({ filter }: { filter: Filter }) {
  const board: BoardId = filter === "all" ? "lcd169" : filter;
  const ota = otaFileName(BOARD_BY_ID[board], DOC_VERSION);
  return (
    <section id="update" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>updating firmware</SectionHeading>
      <Lead>Over WiFi, about two minutes. Your WiFi and settings survive it.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div>
          <div className="grid gap-2.5">
            {UPDATE_STEPS.map((s, i) => (
              <Step key={i} n={i + 1}>
                <Rich text={s} slots={{ ota: <Code>{ota}</Code> }} />
              </Step>
            ))}
          </div>
          <Callout className="mt-3.5">
            <b className="font-bold text-gray-900">First time on this board?</b> The first install is over USB with the{" "}
            <Code>-factory.bin</Code>. See{" "}
            <VbLink href="/vizbot/releases#usb" className={linkCls}>
              First install over USB
            </VbLink>{" "}
            on the downloads page.
          </Callout>
        </div>
        <div className="grid gap-3.5">
          <FilenameAnatomy board={board} version={DOC_VERSION} />
          <TokenList highlight={filter === "all" ? undefined : filter} />
        </div>
      </div>
    </section>
  );
}

function BoardNotes({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter) => void }) {
  const boards = BOARDS.filter((b) => filter === "all" || b.id === filter);
  return (
    <section id="boards" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={5}>board notes</SectionHeading>
      <Lead>What's different on each board, and how to tell which one you've got.</Lead>
      <div className="mb-3 flex items-center gap-2.5 lg:hidden">
        <label htmlFor="vb-board-notes" className="flex-none text-[13px] font-medium text-gray-700">
          Your board
        </label>
        <BoardSelect id="vb-board-notes" value={filter} onChange={setFilter} className="h-[38px] rounded-lg text-[15px]" />
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        {boards.map((b) => (
          <article key={b.id} className="rounded-xl border border-gray-200 bg-white px-5 py-[18px]">
            <div className="mb-2.5 flex items-center gap-3">
              <BoardIcon id={b.id} size={36} />
              <div>
                <h3 className="font-slackey text-[17px] font-normal leading-tight md:text-lg">{b.short}</h3>
                <p className="text-[13px] text-muted-foreground">{b.hint}</p>
              </div>
            </div>
            <ul className="list-disc pl-[18px] text-[14.5px] leading-normal text-gray-700 marker:text-yellow-800">
              {b.notes.map((n) => (
                <li key={n} className="mb-1.5">
                  <Rich text={n} />
                </li>
              ))}
              <li className="mb-1.5">
                Update file: the one with <Code>{b.token}</Code> in the name.
              </li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Help({ filter }: { filter: Filter }) {
  const fixes = FIXES.filter((f) => filter === "all" || !f.boards || f.boards.includes(filter as BoardId));
  return (
    <section id="help" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={6}>if something's off</SectionHeading>
      {/* phones: disclosures; wider: cards */}
      <div className="mt-[18px] grid gap-2 md:hidden">
        {fixes.map((f, i) => (
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
        {fixes.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-[18px]">
            <h3 className="vb-plain mb-1.5 text-[15px] font-bold text-gray-900">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <Rich text={f.body} />
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between md:px-[22px] md:py-[18px]">
        <p className="text-[15px] text-gray-700">Still stuck, or found a bug?</p>
        <Btn href={ISSUES_URL} kind="dark" icon={<Code2 className="h-4 w-4" />} className="px-3.5 py-2 text-sm">
          Open an issue on GitHub
        </Btn>
      </div>
    </section>
  );
}

export default function VizBotGuide() {
  const [filter, setFilter] = useState<Filter>("all");
  const active = useActiveSection(TOC, filter);
  useHashScroll();

  return (
    <>
      <SEO
        title="vizBot user guide"
        description="Get vizBot on your WiFi, update the firmware, read the notes for your board, fix common problems."
        image={SCREENS.dock}
        keywords="vizBot, user guide, ESP32, Stackchan, CoreS3, firmware update"
      />
      <VizBotShell>
        <DocHero
          eyebrow={`user guide · firmware ${DOC_VERSION}`}
          title="Getting along with vizBot."
          lead="How to get it online, keep it updated, and fix it when something's off. The touch screen and the web panel have their own pages."
          quick={[
            { t: "New bot?", d: "Get it on your WiFi.", href: "setup", n: 1 },
            { t: "Updating?", d: "Four steps, two minutes.", href: "update", n: 4 },
            { t: "Stuck?", d: "Common problems and fixes.", href: "help", n: 6 },
          ]}
        />
        <JumpBar items={TOC} active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc items={TOC} active={active} label="Guide sections">
            <FilterBox value={filter} onChange={setFilter} />
          </Toc>
          <div className="min-w-0">
            <FilterBanner filter={filter} setFilter={setFilter} name={filter === "all" ? "" : BOARD_BY_ID[filter].short} />
            <Setup />
            <Touch filter={filter} />
            <WebPanel />
            <Update filter={filter} />
            <BoardNotes filter={filter} setFilter={setFilter} />
            <Help filter={filter} />
          </div>
        </div>
      </VizBotShell>
    </>
  );
}

