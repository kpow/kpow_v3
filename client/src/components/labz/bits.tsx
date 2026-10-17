// 8x8 labz building blocks: the pixel grid that draws a real catalog icon, a
// palette ramp, and the small row/bullet lists the two pages share. Everything
// else comes from ../vizbot/bits and ../vizbot/docs.

import type { ReactNode } from "react";
import { COLORS, ICON_BY_SLUG, ICONS, type PixelIcon } from "@/content/labz-icons";
import { Rich } from "@/components/vizbot/bits";
import { cn } from "@/lib/utils";

/** One catalog icon as an 8×8 CSS grid. `px` is the on-page size of one pixel. */
export function PixelGrid({
  icon,
  px = 14,
  glow = false,
  className,
}: {
  icon: PixelIcon | string;
  px?: number;
  glow?: boolean;
  className?: string;
}) {
  const art = typeof icon === "string" ? ICON_BY_SLUG[icon] : icon;
  if (!art) return null;
  return (
    <div
      className={cn("lz-grid", glow && "lz-grid-glow", className)}
      style={{ "--px": `${px}px` } as React.CSSProperties}
      role="img"
      aria-label={`${art.name}, an 8 by 8 pixel icon`}
    >
      {Array.from(art.px, (ch, i) => {
        const off = ch === "0";
        const color = COLORS[parseInt(ch, 36)];
        return <i key={i} {...(off ? { "data-off": "" } : {})} style={off ? undefined : { background: color, color }} />;
      })}
    </div>
  );
}

/** A grid of icons on the panel's black, as they'd look on the matrix. */
export function IconStrip({
  slugs,
  px = 11,
  cols = "grid-cols-4",
  className,
}: {
  slugs?: string[];
  px?: number;
  /** Tailwind grid-cols-* for the layout; the icons stay square. */
  cols?: string;
  className?: string;
}) {
  const list = slugs ? slugs.map((s) => ICON_BY_SLUG[s]).filter(Boolean) : ICONS;
  return (
    <div className={cn("grid justify-center gap-2.5 sm:gap-3", cols, className)}>
      {list.map((icon) => (
        <PixelGrid key={icon.slug} icon={icon} px={px} />
      ))}
    </div>
  );
}

/** Six shades of one palette family. */
export function Ramp({ hexes, className }: { hexes: string[]; className?: string }) {
  return (
    <div className={cn("lz-ramp", className)}>
      {hexes.map((h) => (
        <span key={h} style={{ background: h }} />
      ))}
    </div>
  );
}

/** A key/value list: the label column, then the prose. Rich markup allowed in `v`. */
export function Rows({
  rows,
  cols = "sm:grid-cols-[150px_1fr]",
  className,
}: {
  rows: readonly { k: string; v: string }[];
  cols?: string;
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200", className)}>
      {rows.map((r) => (
        <div key={r.k} className={cn("grid gap-x-4 gap-y-1 bg-white px-4 py-3", cols)}>
          <dt className="vb-mono text-[13px] font-medium text-[var(--vb-yellow-ink)]">{r.k}</dt>
          <dd className="text-[14.5px] leading-relaxed text-gray-700">
            <Rich text={r.v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A bulleted list with the accent dot, for Rich strings. */
export function Bullets({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("grid gap-1.5 text-[15px] leading-relaxed text-gray-700", className)}>
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-[var(--vb-yellow)]" aria-hidden="true" />
          <span>
            <Rich text={t} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A wrapping set of small labels, for the pattern and transition names. */
export function Tags({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3.5 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="vb-mono rounded-md border border-[var(--vb-tint-border)] bg-[var(--vb-tint)] px-2 py-0.5 text-[12px] text-[var(--vb-yellow-ink)]"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/** A photo with a monospace caption, the shape used across the viz pages. */
export function Shot({
  photo,
  caption,
  ratio = "aspect-[4/3]",
  className,
  priority = false,
}: {
  photo: { src: string; w: number; h: number; alt: string };
  caption?: ReactNode;
  ratio?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <img
        src={photo.src}
        width={photo.w}
        height={photo.h}
        alt={photo.alt}
        {...(priority ? {} : { loading: "lazy" as const })}
        className={cn("block h-auto w-full rounded-xl border border-gray-200 bg-[#0e1014] object-cover", ratio)}
      />
      {caption ? (
        <figcaption className="vb-mono mt-2.5 text-center text-xs text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
