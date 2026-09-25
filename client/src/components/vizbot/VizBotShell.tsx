// The vizBot section wrapper. `.vizbot` scopes the yellow accent and the device
// frames (vizbot.css), the same way `.buildlog` scopes its purple. It sits inside
// the site's normal Layout card and adds the shared sub-nav.

import { useEffect, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { splitReleases, useVizbotReleases, versionOf } from "@/lib/vizbot";
import { DOC_VERSION } from "@/content/vizbot";
import { DinoGlyph } from "./icons";
import "./vizbot.css";

// `short` is the phone label: five tabs have to fit a 360px screen.
const TABS = [
  { name: "overview", short: "overview", href: "/vizbot" },
  { name: "user guide", short: "guide", href: "/vizbot/guide" },
  { name: "touch screen", short: "touch", href: "/vizbot/touch" },
  { name: "web panel", short: "web", href: "/vizbot/web" },
  { name: "downloads", short: "downloads", href: "/vizbot/releases" },
];

function VersionChip() {
  const { data, isLoading } = useVizbotReleases();
  const { latest } = splitReleases(data);
  const label = latest ? `v${versionOf(latest)} · latest` : isLoading ? "firmware" : `v${DOC_VERSION} · soon`;
  return (
    <Link
      href="/vizbot/releases"
      className="vb-mono vb-focus inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-yellow-200 bg-yellow-50 px-[11px] py-1 text-xs font-medium text-yellow-800 no-underline hover:bg-yellow-100"
    >
      <span className="h-2 w-2 rounded-full bg-[#FFD23F] shadow-[0_0_0_1.5px_#0a0a0a]" aria-hidden="true" />
      {label}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/vizbot" className="vb-focus flex items-center gap-2 rounded-md text-[#0a0a0a] no-underline">
      <DinoGlyph />
      <span className="font-slackey text-[22px] leading-none">vizBot</span>
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
          <nav aria-label="vizBot" className="flex gap-1">
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
          </nav>
        </div>
        <VersionChip />
      </div>
      {/* mobile */}
      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Brand />
          <VersionChip />
        </div>
        <nav aria-label="vizBot" className="flex gap-[3px] rounded-[9px] bg-gray-100 p-[3px]">
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
              {t.short}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

/**
 * Scroll to location.hash once the target exists. The site's ScrollToTop jumps
 * to 0 on every route change, and some targets (the releases blocks) only
 * render after data arrives, so this re-checks whenever `ready` changes.
 */
export function useHashScroll(ready: unknown = true) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView({ block: "start" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [ready]);
}

export function VizBotShell({ children }: { children: ReactNode }) {
  return (
    <div className="vizbot mx-auto w-full max-w-6xl px-2 py-2 sm:px-4 sm:py-4">
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap"
        />
      </Helmet>
      <SubNav />
      {children}
    </div>
  );
}
