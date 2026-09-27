// The vizMac section wrapper, the sibling of VizBotShell. `.vizmac` scopes the
// periwinkle accent (vizmac.css) and opts into vizBot's shared building blocks
// (vizbot.css). It sits inside the site's normal Layout card and adds the sub-nav.

import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILDLOG_URL, FW_LABEL } from "@/content/vizmac";
import { SkullGlyph } from "./icons";
import "../vizbot/vizbot.css";
import "./vizmac.css";

// `short` is the phone label.
const TABS = [
  { name: "overview", short: "overview", href: "/vizmac" },
  { name: "user guide", short: "guide", href: "/vizmac/guide" },
  { name: "controller", short: "controller", href: "/vizmac/controller" },
];

function VersionChip() {
  return (
    <Link
      href="/vizmac/controller#update"
      className="vb-mono vb-focus inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-[11px] py-1 text-xs font-medium text-indigo-800 no-underline hover:bg-indigo-100"
    >
      <span className="h-2 w-2 rounded-full bg-[#7AA2FF] shadow-[0_0_0_1.5px_#0a0a0a]" aria-hidden="true" />
      <span className="hidden sm:inline">controller fw · </span>
      {FW_LABEL}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/vizmac" className="vb-focus flex items-center gap-2 rounded-md text-[#0a0a0a] no-underline">
      <span className="grid h-[30px] w-[30px] place-items-center rounded-lg border-[1.5px] border-[#0a0a0a] bg-[#7AA2FF]">
        <SkullGlyph className="h-[19px] w-[19px]" />
      </span>
      <span className="font-slackey text-[22px] leading-none">vizMac</span>
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
          <nav aria-label="vizMac" className="flex gap-1">
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
            <Link
              href={BUILDLOG_URL}
              className="vb-focus inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 no-underline hover:bg-gray-100 hover:text-gray-900"
            >
              build log <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
        <nav aria-label="vizMac" className="flex gap-[3px] rounded-[9px] bg-gray-100 p-[3px]">
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
          <Link
            href={BUILDLOG_URL}
            className="vb-focus flex-auto whitespace-nowrap rounded-md px-1.5 py-[7px] text-center text-[13px] font-medium text-gray-600 no-underline"
          >
            build log
          </Link>
        </nav>
      </div>
    </div>
  );
}

export function VizMacShell({ children }: { children: ReactNode }) {
  return (
    <div className="vizmac mx-auto w-full max-w-6xl px-2 py-2 sm:px-4 sm:py-4">
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
