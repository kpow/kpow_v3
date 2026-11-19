// The tinyfun section wrapper, the sibling of TinyRadarShell. `.tinyfun`
// scopes the lime accent (tinyfun.css) and opts into vizBot's shared building
// blocks (vizbot.css). It sits inside the site's normal Layout card and adds
// the sub-nav.

import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILDLOG_URL, INSIDE_URL } from "@/content/tinyfun";
import "../vizbot/vizbot.css";
import "./tinyfun.css";

const TABS = [
  { name: "guide", href: "/tinyfun" },
  { name: "updates", href: "/tinyfun/update" },
];

// Not wouter links: /tinyfun-m1/ is a static page outside the React app.
const EXTRA = [
  { name: "inside", href: INSIDE_URL, plain: true },
  { name: "build log", href: BUILDLOG_URL, plain: false },
];

export function Mark({ size = 22, className }: { size?: number; className?: string }) {
  return <span className={cn("tf-mark", className)} style={{ width: size, height: size * 1.25 }} aria-hidden="true" />;
}

function UpdateChip() {
  return (
    <Link
      href="/tinyfun/update"
      className="vb-mono vb-focus inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-lime-200 bg-lime-50 px-[11px] py-1 text-xs font-medium text-lime-800 no-underline hover:bg-lime-100"
    >
      <span className="h-2 w-2 rounded-full bg-[var(--vb-yellow)] shadow-[0_0_0_1.5px_#0a0a0a]" aria-hidden="true" />
      <span className="hidden sm:inline">firmware · </span>
      latest
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/tinyfun" className="vb-focus flex items-center gap-2 rounded-md text-[#0a0a0a] no-underline">
      <Mark />
      <span className="font-slackey text-[22px] leading-none">tinyfun</span>
    </Link>
  );
}

function Extra({ e, className }: { e: (typeof EXTRA)[number]; className: string }) {
  const inner = (
    <>
      {e.name} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </>
  );
  return e.plain ? (
    <a href={e.href} className={className}>
      {inner}
    </a>
  ) : (
    <Link href={e.href} className={className}>
      {inner}
    </Link>
  );
}

function SubNav() {
  const [location] = useLocation();
  const path = location.replace(/\/+$/, "") || "/";
  const tabs = TABS.map((t) => ({ ...t, on: path === t.href }));
  return (
    <div className="mb-7 md:mb-9">
      {/* desktop */}
      <div className="hidden items-center justify-between gap-4 border-b border-gray-200 pb-3.5 md:flex">
        <div className="flex items-center gap-7">
          <Brand />
          <nav aria-label="tinyfun" className="flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={t.on ? "page" : undefined}
                className={cn(
                  "vb-focus rounded-md px-3 py-1.5 text-sm font-medium no-underline",
                  t.on ? "bg-[#0a0a0a] text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                {t.name}
              </Link>
            ))}
            {EXTRA.map((e) => (
              <Extra
                key={e.href}
                e={e}
                className="vb-focus inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 no-underline hover:bg-gray-100 hover:text-gray-900"
              />
            ))}
          </nav>
        </div>
        <UpdateChip />
      </div>
      {/* mobile */}
      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Brand />
          <UpdateChip />
        </div>
        <nav aria-label="tinyfun" className="flex gap-[3px] rounded-[9px] bg-gray-100 p-[3px]">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.on ? "page" : undefined}
              className={cn(
                "vb-focus flex-auto whitespace-nowrap rounded-md px-1.5 py-[7px] text-center text-[13px] font-medium no-underline",
                t.on ? "bg-[#0a0a0a] text-white" : "text-gray-600",
              )}
            >
              {t.name}
            </Link>
          ))}
          {EXTRA.map((e) =>
            e.plain ? (
              <a
                key={e.href}
                href={e.href}
                className="vb-focus flex-auto whitespace-nowrap rounded-md px-1.5 py-[7px] text-center text-[13px] font-medium text-gray-600 no-underline"
              >
                {e.name}
              </a>
            ) : (
              <Link
                key={e.href}
                href={e.href}
                className="vb-focus flex-auto whitespace-nowrap rounded-md px-1.5 py-[7px] text-center text-[13px] font-medium text-gray-600 no-underline"
              >
                {e.name}
              </Link>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}

export function TinyFunShell({ children }: { children: ReactNode }) {
  return (
    <div className="tinyfun mx-auto w-full max-w-6xl px-2 py-2 sm:px-4 sm:py-4">
      <SubNav />
      {children}
    </div>
  );
}
