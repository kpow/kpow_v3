import { useEffect, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Cloud,
  Code2,
  Cpu,
  Download,
  LayoutGrid,
  MessageSquare,
  Palette,
  Smile,
  CircleDot,
  Volume2,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { VizBotShell, useHashScroll } from "@/components/vizbot/VizBotShell";
import { DinoFrame, LandscapeFrame } from "@/components/vizbot/frames";
import { BoardIcon, GestureGlyph } from "@/components/vizbot/icons";
import { FilenameAnatomy, TokenList } from "@/components/vizbot/files";
import {
  Btn,
  Callout,
  Caption,
  Chip,
  Code,
  Eyebrow,
  Lead,
  NumBadge,
  Rich,
  SectionHeading,
  Step,
  SubHead,
  VbLink,
  linkCls,
} from "@/components/vizbot/bits";
import {
  BOARDS,
  BOARD_BY_ID,
  CAT,
  DOCK_TILES,
  DOC_VERSION,
  FIXES,
  GESTURES,
  ISSUES_URL,
  LANDSCAPE_SHOTS,
  PANEL,
  SCREENS,
  SETTINGS,
  SETUP_STEPS,
  SHEETS,
  TOC,
  UPDATE_STEPS,
  isBoardId,
  otaFileName,
  type BoardId,
  type PanelIcon,
} from "@/content/vizbot";
import { cn } from "@/lib/utils";

// vizBot user guide. Copy and layout from the comps (GuideDesktop / GuideMobile).
// Desktop: sticky TOC with the section in view highlighted. Phones: a sticky
// "Jump to" select under the site header. "Show notes for" hides what doesn't
// apply to one board.

type Filter = "all" | BoardId;

const PANEL_ICONS: Record<PanelIcon, LucideIcon> = {
  smile: Smile,
  chat: MessageSquare,
  robot: Bot,
  palette: Palette,
  chip: Cpu,
  cloud: Cloud,
  wifi: Wifi,
  grid: LayoutGrid,
  speaker: Volume2,
  led: CircleDot,
};

const sectionCls = "scroll-mt-32 lg:scroll-mt-24";

function useActiveSection(deps: unknown) {
  const [active, setActive] = useState(TOC[0].id);
  useEffect(() => {
    const vis = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => vis.set(e.target.id, e.isIntersecting));
        const first = TOC.find((t) => vis.get(t.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-96px 0px -55% 0px" },
    );
    TOC.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [deps]);
  return active;
}

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(history.state, "", `#${id}`);
}

const BOARD_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All boards" },
  ...BOARDS.map((b) => ({ value: b.id as Filter, label: b.short })),
];

function BoardSelect({ id, value, onChange, className }: { id: string; value: Filter; onChange: (f: Filter) => void; className?: string }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value === "all" || !isBoardId(e.target.value) ? "all" : e.target.value)}
      className={cn(
        "vb-focus h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm text-[#0a0a0a]",
        className,
      )}
    >
      {BOARD_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toc({ active, filter, setFilter }: { active: string; filter: Filter; setFilter: (f: Filter) => void }) {
  return (
    <aside className="sticky top-24 hidden self-start lg:block">
      <p className="vb-mono mb-2 ml-2 text-[11px] font-medium uppercase tracking-[1.4px] text-muted-foreground">
        on this page
      </p>
      <nav aria-label="Guide sections">
        <ol className="grid gap-0.5">
          {TOC.map((t, i) => {
            const on = t.id === active;
            const hideSubs = filter === "lcd13" && t.id === "touch";
            return (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(t.id);
                  }}
                  aria-current={on ? "location" : undefined}
                  className={cn(
                    "vb-focus flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm no-underline",
                    on ? "bg-yellow-50 font-medium text-[#0a0a0a]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-[22px] w-[22px] flex-none place-items-center rounded-md font-slackey text-[11px]",
                      on ? "border-[1.5px] border-[#0a0a0a] bg-[#FFD23F] text-[#0a0a0a]" : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {i + 1}
                  </span>
                  {t.name}
                </a>
                {t.subs.length > 0 && !hideSubs && (
                  <ul className="mb-1.5 mt-0.5">
                    {t.subs.map((s, j) => {
                      if (j === 4 && filter === "lcd169") return null;
                      return (
                        <li key={s}>
                          <a
                            href={`#${t.id}-${j}`}
                            onClick={(e) => {
                              e.preventDefault();
                              goTo(`${t.id}-${j}`);
                            }}
                            className="block py-[3px] pl-10 pr-2 text-[13px] text-gray-600 no-underline hover:text-gray-900"
                          >
                            {s}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="mt-[22px] rounded-[10px] border border-gray-200 p-3.5">
        <label htmlFor="vb-board-filter" className="mb-1.5 block text-xs font-medium text-gray-700">
          Show notes for
        </label>
        <BoardSelect id="vb-board-filter" value={filter} onChange={setFilter} />
        <p className="mt-2 text-xs leading-normal text-muted-foreground">Hides the bits that don't apply to your board.</p>
      </div>
      <VbLink
        href="/vizbot/releases"
        className="vb-focus mt-3 flex items-center justify-between gap-2 rounded-[10px] bg-[#0a0a0a] px-3.5 py-3 text-sm font-medium text-white no-underline hover:bg-[#262626]"
      >
        <span>Firmware downloads</span>
        <Download className="h-4 w-4 text-[#FFD23F]" />
      </VbLink>
      <a
        href={ISSUES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 flex items-center gap-2 px-2 py-1 text-[13px] text-gray-600 no-underline hover:text-gray-900"
      >
        <Code2 className="h-[15px] w-[15px]" /> Report a problem
      </a>
    </aside>
  );
}

function JumpBar({ active }: { active: string }) {
  return (
    <div className="sticky top-16 z-20 -mx-4 mt-5 flex items-center gap-2.5 border-y border-gray-200 bg-white/95 px-4 py-2.5 shadow-[0_6px_12px_-10px_rgba(0,0,0,.25)] backdrop-blur lg:hidden">
      <label htmlFor="vb-jump" className="vb-mono flex-none text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground">
        Jump to
      </label>
      <select
        id="vb-jump"
        value={active}
        onChange={(e) => goTo(e.target.value)}
        className="vb-focus h-[38px] min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[15px] font-medium text-[#0a0a0a]"
      >
        {TOC.map((t, i) => (
          <option key={t.id} value={t.id}>
            {i + 1} · {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Hero() {
  const quick = [
    { t: "New bot?", d: "Start with getting it online.", href: "setup", n: 1 },
    { t: "Updating?", d: "Four steps, about two minutes.", href: "update", n: 4 },
    { t: "Stuck?", d: "The usual snags and fixes.", href: "help", n: 6 },
  ];
  return (
    <section className="border-b border-gray-200 pb-7 md:pb-9 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-12">
      <div>
        <Eyebrow>user guide · firmware {DOC_VERSION}</Eyebrow>
        <h1 className="mb-3.5 font-slackey text-[34px] font-normal leading-[1.08] md:text-[46px]">Getting along with vizBot.</h1>
        <p className="max-w-[52ch] text-base leading-relaxed text-gray-700 md:text-[17px]">
          Everything after unboxing: get it on your WiFi, learn the gestures, find its web panel, and keep it up to date.
        </p>
      </div>
      <div className="mt-[22px] grid gap-2 lg:mt-0">
        {quick.map((q) => (
          <a
            key={q.t}
            href={`#${q.href}`}
            onClick={(e) => {
              e.preventDefault();
              goTo(q.href);
            }}
            className="vb-focus flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 no-underline hover:border-gray-300 hover:bg-gray-50"
          >
            <NumBadge n={q.n} size={28} />
            <span className="block">
              <span className="block text-[15px] font-bold text-gray-900">{q.t}</span>
              <span className="block text-[13.5px] text-muted-foreground">{q.d}</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
          </a>
        ))}
      </div>
    </section>
  );
}

function Applies({ boards }: { boards: string[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Applies to</span>
      {boards.map((b) => (
        <Chip key={b}>{b}</Chip>
      ))}
    </div>
  );
}

function Setup() {
  return (
    <section id="setup" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>get it online</SectionHeading>
      <Lead>You need the bot, a phone and your home WiFi. About 5 minutes.</Lead>
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
            <b className="font-bold text-gray-900">2.4 GHz WiFi only.</b> The bot has no 5 GHz radio. If your router has
            separate 2.4 and 5 GHz names, pick the 2.4 one.
          </Callout>
          <Callout className="mt-2.5">
            <b className="font-bold text-gray-900">Give it a name.</b> In the web panel under WiFi › Device Name, type
            something like <Code>desk</Code>. After a restart it answers at <Code>vizbot-desk.local</Code>.
          </Callout>
        </div>
        <div className="hidden flex-col items-center lg:flex">
          <DinoFrame src={SCREENS.connect} alt="Settings › Connect showing network, address and IP" className="[--sw:176px]" />
          <p className="mt-3.5 max-w-[30ch] text-center text-[13px] leading-normal text-muted-foreground">
            <b className="font-bold text-gray-900">Settings › Connect</b> shows the address and IP once it's online.
            Offline, it shows the hotspot steps.
          </p>
        </div>
      </div>
    </section>
  );
}

function Touch({ filter }: { filter: Filter }) {
  if (filter === "lcd13") {
    return (
      <section id="touch" className={cn("mt-12 md:mt-14", sectionCls)}>
        <SectionHeading num={2}>the touch screen</SectionHeading>
        <Callout className="mt-5">
          The Waveshare 1.3 has no touch screen, so the <a href="#web" className={linkCls}>web panel</a> does everything.
          Pick <b>All boards</b> in “Show notes for” to see the touch section anyway.
        </Callout>
      </section>
    );
  }
  const landscape = filter === "all" || filter === "cores3" || filter === "stackchan";
  const shots = LANDSCAPE_SHOTS.filter((s) => filter === "all" || s.boards.includes(filter as BoardId));
  return (
    <section id="touch" className={cn("mt-12 md:mt-14", sectionCls)}>
      <SectionHeading num={2}>the touch screen</SectionHeading>
      <Lead className="mb-1.5">
        The face owns the screen and everything else is one gesture away. The 1.3 has no touch screen; see{" "}
        <a href="#boards" className={linkCls}>
          board notes
        </a>
        .
      </Lead>
      <Applies boards={["1.69", "CoreS3", "Stackchan"]} />

      {/* gestures */}
      <SubHead id="touch-0">gestures</SubHead>
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

      {/* dock */}
      <SubHead id="touch-1">the quick dock</SubHead>
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          <p className="mb-3.5 text-[15px] leading-relaxed text-gray-700">
            Swipe up (or press and hold) and the face shrinks to the top while six tiles slide up. The pill at the top
            shows the bot's address, handy when you've forgotten it.
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

      {/* sheets */}
      <SubHead id="touch-2">scene, mood, light</SubHead>
      <p className="mb-3.5 text-[15px] leading-relaxed text-gray-700">
        Three dock tiles open a sheet over the bottom of the screen, with the face still live above it.
      </p>
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

      {/* settings */}
      <SubHead id="touch-3">settings</SubHead>
      <p className="mb-3.5 text-[15px] leading-relaxed text-gray-700">
        Tap <b className="font-bold text-gray-900">More</b> in the dock. Six pages, color-coded the same as the dock
        tiles.
      </p>
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

      {/* landscape */}
      {landscape && (
        <>
          <SubHead id="touch-4">CoreS3 and Stackchan</SubHead>
          <p className="mb-3.5 text-[15px] leading-relaxed text-gray-700">
            Same gestures, sideways. The face stays full size; the dock becomes two rails and adds{" "}
            <b className="font-bold text-gray-900">Sound</b>, plus <b className="font-bold text-gray-900">Head</b> on a
            Stackchan or <b className="font-bold text-gray-900">Connect</b> on a plain CoreS3. Settings open as a list on
            the left with the page on the right.
          </p>
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
        </>
      )}
    </section>
  );
}

function WebPanel({ filter }: { filter: Filter }) {
  const items = PANEL.filter((p) => filter === "all" || !p.boards || p.boards.includes(filter as BoardId));
  return (
    <section id="web" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>the web panel</SectionHeading>
      <Lead>
        Open <Code>http://vizbot-xxxx.local</Code> on any phone or computer on the same WiFi. It has everything the touch
        screen has, plus a few things it doesn't.
      </Lead>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((p) => {
          const Icon = PANEL_ICONS[p.icon];
          return (
            <div key={p.name} className="flex items-start gap-3 rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
              <Icon className="mt-0.5 h-[18px] w-[18px] flex-none text-gray-700" strokeWidth={1.8} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                <p className="mt-0.5 text-[13.5px] leading-normal text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Update({ filter }: { filter: Filter }) {
  const board: BoardId = filter === "all" ? "lcd169" : filter;
  const ota = otaFileName(BOARD_BY_ID[board], DOC_VERSION);
  return (
    <section id="update" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>updating firmware</SectionHeading>
      <Lead>Updates go over WiFi and take about two minutes. Your WiFi and settings stay put.</Lead>
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
            <b className="font-bold text-gray-900">Never run vizBot on this board before?</b> The first install needs a USB
            cable, once, and uses the <Code>-factory.bin</Code>. See{" "}
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
      <Lead>What's different on each board, and how to tell which one you have.</Lead>
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
                Update file: the one with <Code>{b.token}</Code> in its name.
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
  const active = useActiveSection(filter);
  useHashScroll();

  return (
    <>
      <SEO
        title="vizBot user guide"
        description="Get vizBot on your WiFi, learn the touch gestures, find its web panel, update the firmware over WiFi, and fix the usual snags."
        image={SCREENS.dock}
        keywords="vizBot, user guide, ESP32, Stackchan, CoreS3, firmware update"
      />
      <VizBotShell>
        <Hero />
        <JumpBar active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc active={active} filter={filter} setFilter={setFilter} />
          <div className="min-w-0">
            {filter !== "all" && (
              <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3.5 py-2 text-sm text-gray-700 lg:mt-9">
                Showing notes for <b className="text-gray-900">{BOARD_BY_ID[filter].short}</b>.
                <button type="button" onClick={() => setFilter("all")} className={cn(linkCls, "vb-focus")}>
                  Show all boards
                </button>
              </div>
            )}
            <Setup />
            <Touch filter={filter} />
            <WebPanel filter={filter} />
            <Update filter={filter} />
            <BoardNotes filter={filter} setFilter={setFilter} />
            <Help filter={filter} />
          </div>
        </div>
      </VizBotShell>
    </>
  );
}

