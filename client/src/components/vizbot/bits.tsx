// Small building blocks shared by the three vizBot pages.

import { Fragment, type ReactNode } from "react";
import { Link } from "wouter";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ links

/** Internal routes go through wouter; hashes and external URLs stay plain <a>. */
export function VbLink({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

export const linkCls = "font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700";

// ------------------------------------------------------------------ rich text

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\{[a-z]+\})/g;

/**
 * Renders the content file's inline markup: **bold**, `code`, [text](href).
 * `{name}` placeholders are filled from `slots`.
 */
export function Rich({ text, slots }: { text: string; slots?: Record<string, ReactNode> }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith("**")) return <b key={i} className="font-bold text-gray-900">{p.slice(2, -2)}</b>;
        if (p.startsWith("`")) return <Code key={i}>{p.slice(1, -1)}</Code>;
        if (p.startsWith("[")) {
          const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
          if (m)
            return (
              <VbLink key={i} href={m[2]} className={linkCls}>
                {m[1]}
              </VbLink>
            );
        }
        if (p.startsWith("{") && slots) {
          const k = p.slice(1, -1);
          if (k in slots) return <Fragment key={i}>{slots[k]}</Fragment>;
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export function Code({ children, dark = false, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  if (dark)
    return (
      <code className={cn("vb-mono rounded bg-white/10 px-1.5 py-px text-[.9em] text-white", className)}>{children}</code>
    );
  const long = typeof children === "string" && children.length > 24;
  return (
    <code
      className={cn(
        "vb-mono rounded border border-gray-200 bg-gray-100 px-[5px] py-px text-[.88em] text-gray-900",
        long ? "[overflow-wrap:anywhere]" : "whitespace-nowrap",
        className,
      )}
    >
      {children}
    </code>
  );
}

// ------------------------------------------------------------------ type

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("vb-mono mb-3 text-xs font-medium uppercase tracking-[1.5px] text-yellow-800", className)}>
      {children}
    </p>
  );
}

export function NumBadge({ n, size = 30, className }: { n: ReactNode; size?: number; className?: string }) {
  return (
    <span
      className={cn("vb-badge", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.47) }}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

export function SectionHeading({ children, num, className }: { children: ReactNode; num?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {num !== undefined && <NumBadge n={num} size={30} className="sm:!h-8 sm:!w-8" />}
      <h2 className="font-slackey text-2xl font-normal leading-tight tracking-tight sm:text-3xl">{children}</h2>
    </div>
  );
}

export function SubHead({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2.5 mt-9 scroll-mt-32 font-slackey text-[17px] font-normal leading-tight sm:text-[19px] lg:scroll-mt-24">
      {children}
    </h3>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-5 mt-2.5 max-w-[68ch] text-[15px] leading-relaxed text-muted-foreground", className)}>{children}</p>;
}

export function Chip({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        "vb-mono inline-block whitespace-nowrap rounded-md border px-[7px] py-0.5 text-[11px]",
        dark ? "border-white/15 bg-white/10 text-gray-300" : "border-gray-200 bg-gray-100 text-gray-700",
      )}
    >
      {children}
    </span>
  );
}

export function Caption({ children, dark = true, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <p
      className={cn(
        "vb-mono mt-3 text-center text-[11px] tracking-[.3px]",
        dark ? "text-gray-400" : "text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

// ------------------------------------------------------------------ blocks

export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#0e1014] shadow-[inset_0_0_0_1px_rgba(255,255,255,.05),0_18px_50px_rgba(0,0,0,.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4">
      <NumBadge n={n} size={30} />
      <div className="pt-[3px] text-[15px] leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}

export function Callout({
  kind = "tip",
  children,
  className,
}: {
  kind?: "tip" | "warn";
  children: ReactNode;
  className?: string;
}) {
  const warn = kind === "warn";
  const Icon = warn ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-sm leading-relaxed",
        warn ? "border-amber-200 bg-amber-50 text-amber-900" : "border-gray-200 bg-gray-50 text-gray-700",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", warn ? "text-amber-800" : "text-gray-600")} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Btn({
  href,
  kind = "primary",
  icon,
  iconRight,
  full = false,
  className,
  children,
}: {
  href: string;
  kind?: "primary" | "outline" | "dark" | "ondark";
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <VbLink href={href} className={cn("vb-btn", `vb-btn-${kind}`, full && "w-full", className)}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </VbLink>
  );
}
