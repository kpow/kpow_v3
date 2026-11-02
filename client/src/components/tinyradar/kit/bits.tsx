// Small pieces the three guide pages share: section heads, short step lists,
// the Settings breadcrumb, screenshots, the "on this page" row and the
// photo/clip placeholder.

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Rich, VbLink } from "@/components/vizbot/bits";
import { goTo, sectionCls } from "@/components/vizbot/docs";
import type { TocItem } from "@/content/vizbot";
import { HOST, SLOTS, type Img, type Slot } from "@/content/tinyradar";
import { cn } from "@/lib/utils";

export function Num({ n, sm = false }: { n: ReactNode; sm?: boolean }) {
  return (
    <span className={cn("tr-num", sm && "sm")} aria-hidden="true">
      {n}
    </span>
  );
}

/** A section: number, Slackey title, one lead line, then whatever it holds. */
export function GuideSection({
  id,
  num,
  title,
  badge,
  lead,
  chips,
  children,
  className,
}: {
  id: string;
  num: ReactNode;
  title: string;
  badge?: string;
  lead: ReactNode;
  chips?: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mt-16 first:mt-10 md:mt-20 md:first:mt-12", sectionCls, className)}>
      <div className="flex items-center gap-3">
        <Num n={num} />
        <h2 className="m-0 min-w-0 font-slackey text-[25px] font-normal leading-tight md:text-[30px]">
          {title}
          {badge ? (
            <span className="vb-mono ml-3 inline-block -translate-y-1 whitespace-nowrap rounded-md bg-[#7C4DFF] px-[7px] py-[3px] align-middle text-[11px] font-bold tracking-[.04em] text-white">
              {badge}
            </span>
          ) : null}
        </h2>
      </div>
      <p className="mb-3.5 mt-2 max-w-[640px] text-[16px] leading-relaxed text-gray-700 md:text-[17px]">{lead}</p>
      {chips?.length ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={c}
              className={cn(
                "vb-mono inline-flex items-center rounded-full border px-[11px] py-1 text-[12.5px] font-medium",
                i === 0 ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-white text-gray-700",
              )}
            >
              {c}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-5" />
      )}
      {children}
    </section>
  );
}

export function SubHead({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h3 id={id} className={cn("mb-3 mt-10 scroll-mt-32 font-slackey text-[18px] font-normal leading-tight md:text-[19px] lg:scroll-mt-24", className)}>
      {children}
    </h3>
  );
}

/** At most five short steps, numbered. */
export function MiniSteps({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ol className={cn("m-0 grid list-none gap-2.5 p-0", className)}>
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <Num n={i + 1} sm />
          <span className="pt-[2px] text-[15px] leading-normal text-gray-700 [overflow-wrap:anywhere]">
            <Rich text={s} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** "tinyradar.local › Settings › Light ring", as one element. */
export function Crumb({ path, host = true }: { path: string[]; host?: boolean }) {
  const parts = host ? [HOST, ...path] : path;
  return (
    <span className="tr-crumb">
      {parts.map((p, i) => (
        <span key={p}>
          {i ? <i aria-hidden="true">› </i> : null}
          {p}
        </span>
      ))}
    </span>
  );
}

/** A capture of the radar's own page, with a thin ink border. */
export function Shot({ img, caption, className, children }: { img: Img; caption?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <figure className={cn("tr-shot", className)}>
      <div className="relative">
        <img src={img.src} width={img.w} height={img.h} alt={img.alt} loading="lazy" decoding="async" />
        {children}
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** A photo or clip that's still to come: a marked box until SLOTS[id].src is set. */
/** `ratio: null` leaves the shape to `className`. */
export function Media({ id, className, ratio }: { id: keyof typeof SLOTS; className?: string; ratio?: string | null }) {
  const s: Slot = SLOTS[id];
  const style = ratio === null ? undefined : { aspectRatio: ratio ?? `${s.w} / ${s.h}` };
  if (s.src) {
    return s.kind === "clip" ? (
      <video
        src={s.src}
        poster={s.poster}
        aria-label={s.alt}
        className={cn("block w-full rounded-xl border-[1.5px] border-[#0a0a0a] bg-black object-cover", className)}
        style={style}
        muted
        loop
        playsInline
        autoPlay
        controls
        preload="metadata"
      />
    ) : (
      <img
        src={s.src}
        alt={s.alt}
        loading="lazy"
        className={cn("block w-full rounded-xl border-[1.5px] border-[#0a0a0a] object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <div className={cn("tr-need", className)} style={style} role="note" aria-label={`Coming soon: ${s.alt}`}>
      <div>
        <b>{s.kind === "clip" ? "CLIP NEEDED" : "PHOTO NEEDED"}</b>
        {s.what}
        <code>SLOTS.{id}</code>
      </div>
    </div>
  );
}

/** "On this page" chips (wide screens). Phones get the sticky JumpBar. */
export function OnThisPage({ items }: { items: TocItem[] }) {
  return (
    <nav aria-label="On this page" className="mt-6 hidden flex-wrap items-center gap-2 lg:flex">
      <span className="vb-mono mr-1 text-[11px] font-medium uppercase tracking-[1.4px] text-muted-foreground">on this page</span>
      {items.map((t, i) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          onClick={(e) => {
            e.preventDefault();
            goTo(t.id);
          }}
          className="vb-focus inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-[13.5px] font-medium text-gray-700 no-underline hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-gray-100 font-slackey text-[11px] text-gray-700">
            {i + 1}
          </span>
          {t.name}
        </a>
      ))}
    </nav>
  );
}

/** A plain hero for the three pages: eyebrow, Slackey title, one line. */
export function GuideHero({ eyebrow, title, lead, aside }: { eyebrow: string; title: string; lead: ReactNode; aside?: ReactNode }) {
  return (
    <section className="grid items-end gap-6 border-b border-gray-200 pb-7 md:pb-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <p className="vb-mono mb-3 text-xs font-medium uppercase tracking-[1.5px] text-[var(--vb-yellow-ink)]">{eyebrow}</p>
        <h1 className="mb-3 font-slackey text-[34px] font-normal leading-[1.08] md:text-[46px]">{title}</h1>
        <p className="max-w-[56ch] text-base leading-relaxed text-gray-700 md:text-[17px]">{lead}</p>
      </div>
      {aside}
    </section>
  );
}

/** "Next: …" link cards at the bottom of a page. */
export function NextCards({ cards }: { cards: { href: string; t: string; d: string; art?: ReactNode }[] }) {
  return (
    <div className="grid gap-3.5 md:grid-cols-3">
      {cards.map((c) => (
        <VbLink
          key={c.href}
          href={c.href}
          className="vb-focus tr-card flex items-center gap-3.5 p-4 text-inherit no-underline transition-transform hover:-translate-y-0.5"
        >
          {c.art}
          <span className="block min-w-0">
            <span className="block text-[15px] font-bold text-gray-900">{c.t}</span>
            <span className="mt-0.5 block text-[13.5px] leading-snug text-gray-600">{c.d}</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
        </VbLink>
      ))}
    </div>
  );
}

/** Question and answer, two lines at most. */
export function FixList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <dl className="m-0 grid gap-2.5">
      {items.map((f) => (
        <div key={f.q} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <dt className="text-[15px] font-bold text-gray-900">{f.q}</dt>
          <dd className="m-0 mt-0.5 text-[14.5px] leading-relaxed text-gray-700">
            <Rich text={f.a} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
