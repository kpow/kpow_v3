// Hand-drawn glyphs for the vizBot pages (lucide-style: 24 grid, round caps).
// Lucide has no gesture or board icons, so these come from the comps.

import type { BoardId, GestureIcon } from "@/content/vizbot";

const GESTURE_PATHS: Record<GestureIcon, JSX.Element> = {
  tap: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7.5" />
    </>
  ),
  long: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="9.5" />
    </>
  ),
  up: (
    <>
      <circle cx="12" cy="19" r="2.5" />
      <path d="M12 15.5V3" />
      <path d="M8 7l4-4 4 4" />
    </>
  ),
  down: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 8.5V21" />
      <path d="M8 17l4 4 4-4" />
    </>
  ),
  side: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M8.5 12H3" />
      <path d="M6 9l-3 3 3 3" />
      <path d="M15.5 12H21" />
      <path d="M18 9l3 3-3 3" />
    </>
  ),
  wait: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5" />
      <path d="M9 2h6" />
    </>
  ),
};

export function GestureGlyph({ name, size = 20, className }: { name: GestureIcon; size?: number; className?: string }) {
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
      {GESTURE_PATHS[name]}
    </svg>
  );
}

const BOARD_PATHS: Record<BoardId, JSX.Element> = {
  // the dino case: dome, three back spikes, a tail nub
  lcd169: (
    <>
      <path d="M21 7.3L24 2.6l3 4.7" />
      <path d="M32.8 9.6l5-1.4-1.4 5" />
      <path d="M15.2 9.6l-5-1.4 1.4 5" />
      <path d="M39 32.5l5.5 3.5-5.5 2.5" />
      <path d="M9 41V22a15 15 0 0 1 30 0v19a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" />
      <rect x="14.5" y="18" width="19" height="21" rx="5" />
    </>
  ),
  lcd13: (
    <>
      <rect x="8" y="7" width="32" height="32" rx="3" />
      <rect x="13" y="12" width="22" height="22" rx="1.5" />
      <path d="M21 39v4" />
      <path d="M27 39v4" />
    </>
  ),
  cores3: (
    <>
      <rect x="5" y="9" width="38" height="31" rx="4" />
      <rect x="9.5" y="13" width="29" height="19" rx="1.5" />
      <path d="M5 36h38" />
    </>
  ),
  stackchan: (
    <>
      <rect x="10" y="3" width="28" height="24" rx="3" />
      <rect x="13.5" y="6.5" width="21" height="15" rx="1" />
      <path d="M19 27v4" />
      <path d="M29 27v4" />
      <path d="M6 31h36v8a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <path d="M12 37h.01" />
      <path d="M18 37h.01" />
      <path d="M24 37h.01" />
      <path d="M30 37h.01" />
      <path d="M36 37h.01" />
    </>
  ),
};

export function BoardIcon({ id, size = 44, className }: { id: BoardId; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "flex-none text-[#0a0a0a]"}
    >
      {BOARD_PATHS[id]}
    </svg>
  );
}

/** Sub-nav brand mark: the 1.69 in its dino case, face on. */
export function DinoGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 -0.5 24 24.5" aria-hidden="true" className="flex-none">
      <g fill="#7DB51F" stroke="#0A0A0A" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M10.2 3.6L12 0.5l1.8 3.1z" />
        <path d="M17.1 4.6l3.2-.6-1.1 3.1z" />
        <path d="M6.9 4.6L3.7 4l1.1 3.1z" />
      </g>
      <path
        d="M4 20.5V11a8 8 0 0 1 16 0v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
        fill="#A4D932"
        stroke="#0A0A0A"
        strokeWidth="1.5"
      />
      <rect x="7" y="9" width="10" height="10" rx="2.6" fill="#0A0A0A" />
      <circle cx="10" cy="13.2" r="1.5" fill="#fff" />
      <circle cx="14" cy="13.2" r="1.5" fill="#fff" />
      <path d="M10.6 16.2h2.8" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
