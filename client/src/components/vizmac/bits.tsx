// Small building blocks for the vizMac doc pages, on top of vizBot's bits.

import type { ReactNode } from "react";
import { ArrowRight, Hammer } from "lucide-react";
import { Caption, Rich, VbLink } from "@/components/vizbot/bits";
import { BUILDLOG_URL, shot, type GlyphRow, type Row } from "@/content/vizmac";
import { cn } from "@/lib/utils";
import { ControllerFrame } from "./frames";
import { ControlGlyph } from "./icons";

/** A bordered key/value table. `cols` is the key column width from `sm` up. */
export function Rows({
  rows,
  cols = "sm:grid-cols-[150px_1fr]",
  groups,
  className,
}: {
  rows?: Row[];
  cols?: string;
  /** Rows under small tinted group headers instead of `rows` */
  groups?: { label: string; rows: Row[] }[];
  className?: string;
}) {
  const row = (r: Row, first: boolean) => (
    <div key={r.k} className={cn("grid gap-1 px-5 py-3 sm:gap-4", cols, !first && "border-t border-gray-200")}>
      <span className="text-sm font-semibold text-gray-800">{r.k}</span>
      <span className="text-sm leading-relaxed text-gray-900">
        <Rich text={r.v} />
      </span>
    </div>
  );
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
      {groups
        ? groups.map((g, gi) => (
            <div key={g.label}>
              <p
                className={cn(
                  "vb-mono border-b border-indigo-200 bg-indigo-50 px-5 py-2 text-[11px] font-medium uppercase tracking-[1px] text-indigo-800",
                  gi > 0 && "border-t",
                )}
              >
                {g.label}
              </p>
              {g.rows.map((r, i) => row(r, i === 0))}
            </div>
          ))
        : rows?.map((r, i) => row(r, i === 0))}
    </div>
  );
}

/** Rows with a controller glyph in front: what each button does on a page. */
export function GlyphRows({ rows, className }: { rows: GlyphRow[]; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
      {rows.map((r, i) => (
        <div
          key={r.k}
          className={cn(
            "grid grid-cols-[34px_1fr] items-center gap-x-3.5 gap-y-0.5 px-4 py-3 sm:grid-cols-[34px_120px_1fr]",
            i > 0 && "border-t border-gray-200",
          )}
        >
          <span className="row-span-2 grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-indigo-200 bg-indigo-50 text-indigo-800 sm:row-span-1">
            <ControlGlyph name={r.glyph} size={19} />
          </span>
          <b className="text-sm font-semibold text-gray-900">{r.k}</b>
          <span className="text-sm leading-relaxed text-gray-700">
            <Rich text={r.v} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** A list with accent dots. `dots` overrides the colour per item. */
export function Bullets({ items, dots, className }: { items: string[]; dots?: string[]; className?: string }) {
  return (
    <ul className={cn("grid gap-1.5 text-[15px] leading-relaxed text-gray-700", className)}>
      {items.map((t, i) => (
        <li key={t} className="flex gap-2.5">
          <span
            className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full"
            style={{ background: dots?.[i] || "var(--vb-yellow)" }}
            aria-hidden="true"
          />
          <span>
            <Rich text={t} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A sideways row of bare 2x controller screens with captions. */
export function ScreenRow({
  shots,
  children,
  className,
}: {
  shots: { id: string; caption: string; alt: string }[];
  /** Extra tiles after the screens (a photo, a placeholder) */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2", className)}>
      {shots.map((s) => (
        <figure key={s.id} className="m-0 flex-none">
          <img
            src={shot(s.id)}
            alt={s.alt}
            width={240}
            height={320}
            loading="lazy"
            decoding="async"
            className="vb-shot w-[150px] rounded-md"
          />
          <figcaption className="vb-mono mt-2 text-center text-[11px] text-muted-foreground">{s.caption}</figcaption>
        </figure>
      ))}
      {children}
    </div>
  );
}

/** The dark stage beside a mode section: the controller showing that page. */
export function ModeAside({
  screen,
  leds,
  alt,
  caption,
  className,
}: {
  screen: string;
  leds: string;
  alt: string;
  caption: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl bg-[#0e1014] py-6", className)}>
      <ControllerFrame screen={screen} leds={leds} alt={alt} className="[--sw:140px] sm:[--sw:150px]" />
      <Caption className="mt-5">{caption}</Caption>
    </div>
  );
}

/** A small hue dot after a mode's heading. */
export function HueDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("h-3 w-3 flex-none rounded-full", className)} style={{ background: color }} aria-hidden="true" />;
}

/** Where a screenshot still has to go. */
export function ShotPlaceholder({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={cn("vm-placeholder", className)} role="img" aria-label={`${title}: ${body}`}>
      <b className="vb-mono text-[11px] font-medium uppercase tracking-[1.4px]">{title}</b>
      <span className="max-w-[36ch] text-[13px] leading-snug">{body}</span>
    </div>
  );
}

/** The "The buttons" cheat sheet under the TOC. */
export function ButtonCard() {
  const rows: { glyph: GlyphRow["glyph"]; k: string; v: string }[] = [
    { glyph: "turn", k: "Turn", v: "move, change" },
    { glyph: "push", k: "Push", v: "back" },
    { glyph: "ko", k: "KO", v: "choose" },
    { glyph: "ko", k: "Hold KO", v: "shortcut" },
    { glyph: "sleep", k: "Hold knob 2 s", v: "sleep" },
  ];
  return (
    <div className="mt-[22px] rounded-[10px] border border-gray-200 p-3.5">
      <p className="mb-2 text-xs font-medium text-gray-700">The buttons</p>
      <ul className="grid gap-1.5 text-[12.5px] leading-snug text-gray-700">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center gap-2">
            <ControlGlyph name={r.glyph} size={16} className="flex-none text-indigo-800" />
            <span>
              <b className="text-gray-900">{r.k}</b> {r.v}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A card pointing at the other doc page (like the vizBot guide's pointer cards). */
export function Pointer({
  href,
  title,
  body,
  cta,
  art,
  className,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  art: ReactNode;
  className?: string;
}) {
  return (
    <VbLink
      href={href}
      className={cn(
        "vb-focus group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white no-underline hover:border-gray-300 sm:flex-row",
        className,
      )}
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

/** Under the TOC: the build log, and the other doc page. */
export function TocFooter({ other }: { other: { href: string; label: string } }) {
  return (
    <>
      <VbLink
        href={BUILDLOG_URL}
        className="vb-focus mt-3 flex items-center justify-between gap-2 rounded-[10px] bg-[#0a0a0a] px-3.5 py-3 text-sm font-medium text-white no-underline hover:bg-[#262626]"
      >
        <span>Build log</span>
        <Hammer className="h-4 w-4 text-[#7AA2FF]" />
      </VbLink>
      <VbLink
        href={other.href}
        className="mt-2.5 flex items-center gap-2 px-2 py-1 text-[13px] text-gray-600 no-underline hover:text-gray-900"
      >
        <ArrowRight className="h-[15px] w-[15px]" /> {other.label}
      </VbLink>
    </>
  );
}
