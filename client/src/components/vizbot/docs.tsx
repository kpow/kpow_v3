// The long-read layout shared by the guide, touch and web panel pages: hero with
// quick links, a sticky "on this page" TOC on desktop, a sticky "Jump to"
// select on phones, and the "Show notes for" board filter.

import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Code2, Download } from "lucide-react";
import { BOARDS, ISSUES_URL, isBoardId, type BoardId, type TocItem } from "@/content/vizbot";
import { cn } from "@/lib/utils";
import { Chip, Eyebrow, NumBadge, VbLink } from "./bits";

export type Filter = "all" | BoardId;

/** Scroll margin for sections: clears the site header (and the jump bar on phones). */
export const sectionCls = "scroll-mt-32 lg:scroll-mt-24";

export function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(history.state, "", `#${id}`);
}

/** Items the filter leaves in. */
export function visibleToc(items: TocItem[], filter: Filter) {
  return items.filter((t) => filter === "all" || !t.boards || t.boards.includes(filter));
}

/** The first TOC section in the top half of the viewport. */
export function useActiveSection(items: TocItem[], deps?: unknown) {
  const [active, setActive] = useState(items[0].id);
  const key = items.map((t) => t.id).join(",");
  useEffect(() => {
    const vis = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => vis.set(e.target.id, e.isIntersecting));
        const first = items.find((t) => vis.get(t.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-96px 0px -55% 0px" },
    );
    items.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, deps]);
  return active;
}

export function BoardSelect({
  id,
  value,
  onChange,
  boards = BOARDS.map((b) => b.id),
  className,
}: {
  id: string;
  value: Filter;
  onChange: (f: Filter) => void;
  boards?: BoardId[];
  className?: string;
}) {
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
      <option value="all">All boards</option>
      {BOARDS.filter((b) => boards.includes(b.id)).map((b) => (
        <option key={b.id} value={b.id}>
          {b.short}
        </option>
      ))}
    </select>
  );
}

/** "Show notes for" box under the desktop TOC. */
export function FilterBox({
  value,
  onChange,
  boards,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
  boards?: BoardId[];
}) {
  return (
    <div className="mt-[22px] rounded-[10px] border border-gray-200 p-3.5">
      <label htmlFor="vb-board-filter" className="mb-1.5 block text-xs font-medium text-gray-700">
        Show notes for
      </label>
      <BoardSelect id="vb-board-filter" value={value} onChange={onChange} boards={boards} />
      <p className="mt-2 text-xs leading-normal text-muted-foreground">Hides the bits that don't apply to your board.</p>
    </div>
  );
}

export function Toc({
  items,
  active,
  label,
  children,
}: {
  items: TocItem[];
  active: string;
  label: string;
  /** Extras under the list, e.g. the board filter */
  children?: ReactNode;
}) {
  return (
    <aside className="sticky top-24 hidden self-start lg:block">
      <p className="vb-mono mb-2 ml-2 text-[11px] font-medium uppercase tracking-[1.4px] text-muted-foreground">
        on this page
      </p>
      <nav aria-label={label}>
        <ol className="grid gap-0.5">
          {items.map((t, i) => {
            const on = t.id === active;
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
              </li>
            );
          })}
        </ol>
      </nav>
      {children}
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

export function JumpBar({ items, active }: { items: TocItem[]; active: string }) {
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
        {items.map((t, i) => (
          <option key={t.id} value={t.id}>
            {i + 1} · {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface QuickLink {
  t: string;
  d: string;
  /** A section id on this page */
  href: string;
  n: number;
}

export function DocHero({
  eyebrow,
  title,
  lead,
  quick,
}: {
  eyebrow: string;
  title: string;
  lead: ReactNode;
  quick: QuickLink[];
}) {
  return (
    <section className="border-b border-gray-200 pb-7 md:pb-9 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-12">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mb-3.5 font-slackey text-[34px] font-normal leading-[1.08] md:text-[46px]">{title}</h1>
        <p className="max-w-[52ch] text-base leading-relaxed text-gray-700 md:text-[17px]">{lead}</p>
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

export function Applies({ boards, className }: { boards: string[]; className?: string }) {
  return (
    <div className={cn("mt-2.5 flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">Applies to</span>
      {boards.map((b) => (
        <Chip key={b}>{b}</Chip>
      ))}
    </div>
  );
}

/** "Showing notes for X. Show all boards" bar above the content. */
export function FilterBanner({ filter, setFilter, name }: { filter: Filter; setFilter: (f: Filter) => void; name: string }) {
  if (filter === "all") return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3.5 py-2 text-sm text-gray-700 lg:mt-9">
      Showing notes for <b className="text-gray-900">{name}</b>.
      <button
        type="button"
        onClick={() => setFilter("all")}
        className="vb-focus font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
      >
        Show all boards
      </button>
    </div>
  );
}
