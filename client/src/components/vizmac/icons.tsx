// Glyphs for the vizMac pages (lucide-style: 24 grid, round caps). The skull is
// Tabler Icons "skull" (MIT), the same mark as the vizMac menu bar icon. The
// control glyphs are the controller's own hint-row glyphs, redrawn.

import type { Glyph } from "@/content/vizmac";
import { Moon } from "lucide-react";

export function SkullGlyph({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 4c4.418 0 8 3.358 8 7.5c0 1.901 -.755 3.637 -2 4.96l0 2.54a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-2.54c-1.245 -1.322 -2 -3.058 -2 -4.96c0 -4.142 3.582 -7.5 8 -7.5z" />
      <path d="M10 17v3" />
      <path d="M14 17v3" />
      <path d="M9 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </svg>
  );
}

const PATHS: Record<Exclude<Glyph, "sleep">, JSX.Element> = {
  // the knob, turned, with a turn arrow
  turn: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12 16.5 7.5" />
      <path d="M19.8 15.5a8.5 8.5 0 0 1-3 3.6" strokeWidth={1.4} />
    </>
  ),
  // the knob, pushed
  push: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    </>
  ),
  // the KO key cap
  ko: (
    <>
      <rect x="1.5" y="6" width="21" height="12" rx="3.5" />
      <text
        x="12"
        y="15.4"
        textAnchor="middle"
        fontFamily="Roboto, sans-serif"
        fontSize="8.6"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        KO
      </text>
    </>
  ),
};

export function ControlGlyph({ name, size = 20, className }: { name: Glyph; size?: number; className?: string }) {
  if (name === "sleep") return <Moon width={size} height={size} strokeWidth={1.8} aria-hidden="true" className={className} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
