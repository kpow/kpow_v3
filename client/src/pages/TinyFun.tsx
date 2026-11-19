import type { ReactNode } from "react";
import { ArrowRight, Blocks, Box, BrickWall, Dices, Download, Gamepad2, Ghost, Hammer, Plane, Worm, Zap, type LucideIcon } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyFunShell } from "@/components/tinyfun/TinyFunShell";
import { Bullets, Shot } from "@/components/labz/bits";
import { Btn, Eyebrow, Lead, NumBadge, Rich, SectionHeading, VbLink } from "@/components/vizbot/bits";
import { FixList } from "@/components/tinyradar/kit/bits";
import {
  BUILDLOG_URL,
  CHARGE,
  FIXES,
  GAMES,
  GAME_MOVES,
  GOOD_TO_KNOW,
  INSIDE_URL,
  MENU_MOVES,
  PHOTOS,
  START_STEPS,
  type GameCard,
  type Move,
} from "@/content/tinyfun";

// tinyfun: the whole guide on one page, for people who got one as a gift.
// Facts come from content/tinyfun.ts (checked against the kFun repo); updates
// are /tinyfun/update.

/** "hold L + R" -> the words with L, R and OK drawn as key caps. */
function Keys({ text }: { text: string }) {
  const parts = text.split(/\b(L|R|OK)\b/);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {parts.map((p, i) =>
        p === "L" || p === "R" || p === "OK" ? (
          <span key={i} className="tf-key">
            {p}
          </span>
        ) : p.trim() ? (
          <span key={i} className="text-[13px] font-medium text-gray-500">
            {p.trim()}
          </span>
        ) : null,
      )}
    </span>
  );
}

function MoveList({ moves, dark = false }: { moves: Move[]; dark?: boolean }) {
  return (
    <dl className="m-0 grid gap-2.5">
      {moves.map((m) => (
        <div key={m.keys} className="grid grid-cols-[minmax(0,128px)_1fr] items-center gap-3">
          <dt className={dark ? "[&_.text-gray-500]:text-gray-400" : undefined}>
            <Keys text={m.keys} />
          </dt>
          <dd className={`m-0 text-[15px] leading-snug ${dark ? "text-gray-200" : "text-gray-700"}`}>{m.does}</dd>
        </div>
      ))}
    </dl>
  );
}

function Hero() {
  return (
    <section className="grid items-center gap-7 border-b border-gray-200 pb-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-12 lg:pb-11">
      <div>
        <Eyebrow>a tiny game console · six games · three buttons</Eyebrow>
        <h1 className="mb-4 font-slackey text-[38px] font-normal leading-[1.05] tracking-tight md:text-[54px]">
          Six games in your pocket.
        </h1>
        <p className="mb-6 max-w-[44ch] text-base leading-relaxed text-gray-700 md:text-lg">
          tinyfun is a little handheld with a tiny screen and three buttons. It remembers your high scores, and where
          you left off.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Btn href="#games" icon={<Gamepad2 className="h-[17px] w-[17px]" />}>
            How to play
          </Btn>
          <Btn href="/tinyfun/update" kind="outline" icon={<Download className="h-[17px] w-[17px]" />}>
            Updates
          </Btn>
        </div>
      </div>
      <Shot photo={PHOTOS.boot} priority ratio="aspect-video" caption="three tinyfuns, switched on" />
    </section>
  );
}

function Start() {
  return (
    <section id="start" className="mt-10 scroll-mt-24 md:mt-12">
      <SectionHeading>Turn it on</SectionHeading>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div>
          <ol className="m-0 grid list-none gap-3 p-0">
            {START_STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <NumBadge n={i + 1} size={28} />
                <span className="pt-0.5 text-[16px] leading-normal text-gray-700">
                  <Rich text={s} />
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[var(--vb-yellow)]">
              <Zap className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <p className="m-0 pt-1.5 text-[15px] leading-relaxed text-gray-700">
              <Rich text={CHARGE} />
            </p>
          </div>
        </div>
        <Shot photo={PHOTOS.three} caption="screen, L · OK · R, and the switch on the side" />
      </div>
    </section>
  );
}

function Buttons() {
  return (
    <section id="buttons" className="mt-12 scroll-mt-24 md:mt-14">
      <div className="rounded-2xl bg-[#0e1014] px-5 py-6 text-white shadow-[0_18px_50px_rgba(0,0,0,.28)] md:px-11 md:py-10">
        <Eyebrow className="text-[var(--vb-yellow)]">the controls</Eyebrow>
        <h2 className="font-slackey text-[28px] font-normal leading-tight text-white md:text-4xl">Three buttons.</h2>
        <div className="my-5 flex items-center gap-3" aria-label="the buttons: L, OK, R">
          {["L", "OK", "R"].map((k) => (
            <span key={k} className="tf-key !h-11 !min-w-[56px] !text-[17px]">
              {k}
            </span>
          ))}
        </div>
        <div className="grid gap-7 md:grid-cols-2 md:gap-10">
          <div>
            <p className="vb-mono mb-3 text-[11.5px] font-medium uppercase tracking-[1.3px] text-[var(--vb-yellow)]">
              picking a game
            </p>
            <MoveList moves={MENU_MOVES} dark />
          </div>
          <div>
            <p className="vb-mono mb-3 text-[11.5px] font-medium uppercase tracking-[1.3px] text-[var(--vb-yellow)]">
              in a game
            </p>
            <MoveList moves={GAME_MOVES} dark />
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-[18px] md:px-6">
        <Bullets items={GOOD_TO_KNOW} />
      </div>
    </section>
  );
}

// A picture for each game's little screen (the card art on the device is drawn in code).
const GAME_ICON: Record<string, LucideIcon> = {
  Tetris: Blocks,
  Breakout: BrickWall,
  Snake: Worm,
  Invaders: Ghost,
  SkyGrid: Plane,
  Backgammon: Dices,
};

function Game({ g }: { g: GameCard }) {
  const Icon = GAME_ICON[g.name] ?? Gamepad2;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-4 border-b border-gray-100 p-4">
        <div className="tf-screen w-[60px] flex-none">
          <Icon className="h-7 w-7" style={{ color: g.tint }} strokeWidth={2} aria-hidden="true" />
        </div>
        <h3 className="m-0 font-slackey text-[22px] font-normal leading-tight">{g.name}</h3>
      </div>
      <div className="grid gap-3.5 px-4 pb-5 pt-4">
        <MoveList moves={g.moves} />
        <p className="m-0 text-[14.5px] leading-relaxed text-gray-700">{g.how}</p>
      </div>
    </article>
  );
}

function Games() {
  return (
    <section id="games" className="mt-12 scroll-mt-24 md:mt-14">
      <SectionHeading>The games</SectionHeading>
      <Lead>Forgot how one works? Hold OK on its card and tinyfun tells you.</Lead>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Game key={g.name} g={g} />
        ))}
      </div>
    </section>
  );
}

function Fixes() {
  return (
    <section id="help" className="mt-12 scroll-mt-24 md:mt-14">
      <SectionHeading>Something wrong?</SectionHeading>
      <FixList items={FIXES} />
    </section>
  );
}

function Next() {
  const cards: { href: string; icon: ReactNode; t: string; d: string; plain?: boolean }[] = [
    {
      href: "/tinyfun/update",
      icon: <Download className="h-6 w-6 text-[var(--vb-yellow-ink)]" />,
      t: "Updates",
      d: "Get the newest version onto tinyfun with your phone.",
    },
    {
      href: INSIDE_URL,
      icon: <Box className="h-6 w-6 text-[var(--vb-yellow-ink)]" />,
      t: "What's inside",
      d: "Spin the board around in 3D.",
      plain: true,
    },
    {
      href: BUILDLOG_URL,
      icon: <Hammer className="h-6 w-6 text-[var(--vb-yellow-ink)]" />,
      t: "The build log",
      d: "How tinyfun and its bigger siblings got made.",
    },
  ];
  const cls =
    "vb-focus flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 no-underline hover:border-gray-300 hover:bg-gray-50";
  const body = (c: (typeof cards)[number]) => (
    <>
      <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-lg bg-[var(--vb-tint)]">{c.icon}</span>
      <span className="block">
        <span className="block text-[15px] font-bold text-gray-900">{c.t}</span>
        <span className="mt-0.5 block text-[13.5px] text-muted-foreground">{c.d}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 flex-none text-gray-400" />
    </>
  );
  return (
    <section className="mt-12 grid gap-4 md:mt-14 md:grid-cols-3">
      {cards.map((c) =>
        c.plain ? (
          // a static page outside the React app: a plain link, not wouter
          <a key={c.href} href={c.href} className={cls}>
            {body(c)}
          </a>
        ) : (
          <VbLink key={c.href} href={c.href} className={cls}>
            {body(c)}
          </VbLink>
        ),
      )}
    </section>
  );
}

export default function TinyFun() {
  useHashScroll();
  return (
    <>
      <SEO />
      <TinyFunShell>
        <Hero />
        <Start />
        <Buttons />
        <Games />
        <Fixes />
        <Next />
      </TinyFunShell>
    </>
  );
}
