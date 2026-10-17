// Every 8x8 labz fact the two pages share: what it is, first run, the screens,
// the editor, the screen saver, every setting, updating over WiFi and the fixes.
// Keep it in step with the 8x8 repo (kpow/8x8): README.md, docs/user-guide.md,
// docs/hardware.md, spec/FORMAT.md and firmware/cyd-labz/src/ui_*.cpp.
// Checked against handheld firmware 0.10.1 (Oct 17, 2026).
//
// No secrets on these pages: no WiFi names, device keys, server URLs or IPs.
// Examples use obvious placeholders (8x8-labz-XXXX, your-app.ondigitalocean.app).
//
// Rich strings use the inline markup <Rich> renders (components/vizbot/bits.tsx):
// **bold**, `code`, [text](href).

import type { TocItem } from "@/content/vizbot";

/** The handheld firmware these pages describe (firmware/cyd-labz/src/version.h). */
export const FW_LABEL = "v0.10.1";

export const BUILDLOG_URL = "/builds/8x8";
export const REPO_URL = "https://github.com/kpow/8x8";

// ------------------------------------------------------------------ images
// The build log's photo set (client/public/buildlog/8x8/media), reused here.

const M = "/buildlog/8x8/media/";

export const PHOTOS = {
  hero: {
    src: M + "hero.jpg",
    w: 1600,
    h: 1200,
    alt: "The 8x8 labz handheld on a desk, its screen showing the icon catalog and the matrix beside it lit with a pixel icon",
  },
  inHand: {
    src: M + "in-hand.jpg",
    w: 1600,
    h: 1200,
    alt: "The handheld held in one hand, thumb on the touchscreen",
  },
  editor: {
    src: M + "editor-closeup.jpg",
    w: 1200,
    h: 1600,
    alt: "The pixel editor on the handheld: an 8x8 grid part-drawn, with tools and color swatches down the right",
  },
  editorSprite: {
    src: M + "editor-magenta-sprite.jpg",
    w: 1600,
    h: 1200,
    alt: "A magenta sprite being drawn on the handheld, the same image lit up on the LED matrix next to it",
  },
  pacghost: {
    src: M + "pacghost-detail.jpg",
    w: 1600,
    h: 900,
    alt: "A ghost icon on the detail screen, pinned on the LED matrix at the same time",
  },
  matrix: {
    src: M + "matrix-yellow-cross.jpg",
    w: 1600,
    h: 900,
    alt: "The 8x8 WS2812B matrix showing a yellow cross at low brightness",
  },
  fleet: {
    src: M + "fleet-v6.jpg",
    w: 1600,
    h: 900,
    alt: "Several handhelds side by side, each showing a different icon on its matrix",
  },
  caseDesktop: {
    src: M + "desktop-case-final.jpg",
    w: 1600,
    h: 1200,
    alt: "The printed desktop case, closed, with the matrix facing forward",
  },
  caseMobile: {
    src: M + "mobile-case-assembled.jpg",
    w: 1600,
    h: 1200,
    alt: "The assembled mobile case with its battery bay",
  },
} as const;

export type PhotoKey = keyof typeof PHOTOS;

// ------------------------------------------------------------------ landing

export const HIGHLIGHTS = [
  { k: "One catalog", v: "Every icon lives in one place, and the handheld carries all of it in flash." },
  { k: "Draw anywhere", v: "Touch editor on the device, mouse editor in the browser, same catalog either way." },
  { k: "Real pixels", v: "Whatever you draw is on the 8×8 matrix while you draw it, at real scale." },
  { k: "Works offline", v: "No WiFi, no problem: edits queue on the device and upload when there is." },
  { k: "Nothing drifts", v: "One `icons.h` for every other firmware project, instead of a copy per repo." },
];

export interface Part {
  eyebrow: string;
  title: string;
  bullets: { k: string; v: string }[];
}

export const HANDHELD_PART: Part = {
  eyebrow: "the handheld",
  title: "A sketchbook that glows",
  bullets: [
    { k: "Browse", v: "every icon in the catalog, 18 to a page. Opening one plays it on the LEDs." },
    { k: "Draw", v: "pencil, fill, picker and eraser on an 8×8 canvas, with colors picked by family." },
    { k: "Animate", v: "up to 64 frames, each with its own duration, looping or playing once." },
    { k: "Save as new", v: "copy the canvas into a fresh icon and leave the original alone." },
    { k: "Screen saver", v: "your icons, 16 animated patterns, or one of each in turn." },
  ],
};

export const WEB_PART: Part = {
  eyebrow: "the web app",
  title: "Where the catalog lives",
  bullets: [
    { k: "Catalog", v: "search by name, slug or number, filter by tag, show or hide archived icons." },
    { k: "Editor", v: "the same tools plus mirror drawing, onion skin, flip, rotate and nudge." },
    { k: "Palette", v: "one global palette, grouped into families of shades built for the LEDs." },
    { k: "Import", v: "drop in a PNG, a GIF or a sprite strip and it snaps to the nearest colors." },
    { k: "Export", v: "the whole catalog as one C header, in the style your project already uses." },
  ],
};

// ------------------------------------------------------------------ format rules

export const RULES = [
  {
    title: "Icon numbers are permanent",
    body: "Assigned on creation, never reused, never reordered. Icon #4 is #4 in every header that ever gets exported.",
  },
  {
    title: "Icons are archived, never deleted",
    body: "An archived icon keeps its number and stays in the export, flagged hidden. Nothing downstream loses its footing.",
  },
  {
    title: "The palette only grows",
    body: "A color can be recolored or relabeled in place, never removed or moved, because icons store the index, not the color.",
  },
  {
    title: "Slugs lock on first export",
    body: "Once firmware can refer to an icon by name, that name stops moving underneath it.",
  },
];

export const FACTS = [
  { k: "grid", v: "8 × 8" },
  { k: "palette", v: "256 max" },
  { k: "frames", v: "1 – 64" },
  { k: "patterns", v: "16" },
  { k: "transitions", v: "9" },
  { k: "firmware", v: FW_LABEL },
];

// ------------------------------------------------------------------ guide: toc

export const GUIDE_TOC: TocItem[] = [
  { id: "setup", name: "First run" },
  { id: "home", name: "Home" },
  { id: "browse", name: "Browsing icons" },
  { id: "editor", name: "The editor" },
  { id: "leds", name: "The LEDs" },
  { id: "settings", name: "Every setting" },
  { id: "update", name: "Updating over WiFi" },
  { id: "help", name: "If something's off" },
];

// ------------------------------------------------------------------ guide: first run

export const SETUP_STEPS = [
  "**Register the device.** In the web app, open **devices**, add one, and copy the key. It is shown once and stored hashed, so if you lose it, make another.",
  "**Join its network.** A handheld with nothing saved opens its own WiFi called `8x8-labz-XXXX` and puts the steps on Home. Join it from a phone.",
  "**Pick your WiFi.** The setup page opens by itself, or browse to `192.168.4.1`. Tap **Configure WiFi** and choose your network.",
  "**Point it at the catalog.** Fill in the server URL (`https://your-app.ondigitalocean.app`) and paste the device key, then **Save**.",
  "**Let it fill up.** The first sync pulls the palette and every icon into flash. After that it only asks for what changed, every ten minutes, in the background.",
];

export const SETUP_NOTE =
  "Changing the server URL **clears the cache** on purpose: icons from another catalog don't belong to this one. You can reopen the setup page any time from **Settings › WiFi**.";

// ------------------------------------------------------------------ guide: home

export const TILES = [
  { k: "browse", v: "Your five newest icons and the cached count. Opens the catalog." },
  { k: "new", v: "A blank canvas in the editor." },
  { k: "leds", v: "A live mirror of the matrix, the mode, and what's playing on it. **Tap it** to cycle screen saver › test pattern › off." },
  { k: "settings", v: "Brightness, sync, WiFi, touch, the screen saver, LED colors, rotation and updates." },
];

export const STATUS_DOTS = [
  { k: "green", v: "up to date, with how long ago" },
  { k: "blue", v: "connecting, or syncing" },
  { k: "pink", v: "needs setup, offline, or a sync problem" },
  { k: "yellow", v: "the WiFi setup page is open" },
  { k: "grey", v: "still starting up" },
];

// ------------------------------------------------------------------ guide: browse

export const BROWSE_NOTES = [
  "Eighteen icons to a page, oldest first, with the count along the bottom. Archived icons stay cached but don't show.",
  "Icons you drew that haven't uploaded yet come **last**, marked with an upload arrow. They have no number until the server gives them one.",
  "Tapping a cached icon opens it big and **pins it on the LEDs**. Animations play on their own, and **prev** and **next** walk the whole catalog there.",
  "The detail screen shows the icon number, slug, frame count, tags and version, with **Edit** to open it in the editor.",
];

// ------------------------------------------------------------------ guide: editor

export const TOOLS = [
  { k: "pencil", v: "Drag to draw a line of pixels." },
  { k: "fill", v: "Flood fill from the pixel you tap." },
  { k: "pick", v: "Takes that pixel's color, jumps to its family, and switches back to the pencil." },
  { k: "erase", v: "Paints the off color — index 0, which is how the unlit matrix looks." },
  { k: "undo / redo", v: "One step per stroke, fill, frame change or duration change." },
];

export const EDITOR_NOTES = [
  "Colors are picked by **family**: the dropdown lists them all, loose colors under `basics` first. A family's shades fill the swatch grid below it.",
  "The `archive` family holds old colors kept only because existing icons use them. It stays hidden unless the icon you opened actually uses one.",
  "The frame bar under the canvas steps, adds, duplicates and deletes frames, plays the animation, and cycles this frame's duration: **60 › 100 › 150 › 250 › 500 › 1000 ms**.",
  "The matrix mirrors the canvas the whole time, so you're drawing against real light rather than a screen's idea of it.",
];

export const SAVE_STEPS = [
  "**A new icon** asks for a name on the on-screen keyboard, derives the slug from it, and lands at the end of Browse with an upload arrow.",
  "**An existing icon** gives you two choices: **update** it, or **new icon** — save the canvas as a fresh icon and leave the original exactly as it was. That works even with no changes made, so you can fork an icon before touching it.",
  "Either way the edit queues on the device and uploads on the next sync, so a flat battery or no WiFi costs you nothing.",
];

export const CONFLICT_NOTE =
  "If someone changed the same icon on the web in the meantime, nothing is lost: the handheld keeps **both**, uploading yours as a new icon and taking the server's copy for the original.";

// ------------------------------------------------------------------ guide: leds

export const SAVER_MODES = [
  { k: "slideshow", v: "Your cached icons in turn, animating." },
  { k: "patterns", v: "The 16 animated patterns." },
  { k: "mixed", v: "One icon, then one pattern, alternating." },
];

export const PATTERNS = [
  "plasma",
  "galaxy",
  "ripple",
  "chevrons",
  "stripes",
  "checker",
  "scanline",
  "perlin",
  "distorsion",
  "zvortex",
  "snakes",
  "sinusoid",
  "puzzle",
  "bumpmap",
  "xorcery",
  "hiphotic",
];

export const TRANSITIONS = [
  "cut",
  "crossfade",
  "scroll left",
  "scroll right",
  "scroll up",
  "scroll down",
  "wipe",
  "sparkle",
  "pulse",
];

// ------------------------------------------------------------------ guide: settings

export const SETTINGS_ROWS = [
  { k: "led brightness", v: "A slider from 5 to 255, live while you drag. Saved when you let go." },
  { k: "Sync", v: "Syncs now. The line above it carries the last sync's message." },
  { k: "WiFi", v: "Reopens the setup page for the network, server URL and device key." },
  { k: "Touch", v: "Tap the middle of four crosses near the corners. A set of taps that doesn't span enough of the panel is rejected and you start over; walking away keeps the calibration you had." },
  { k: "Saver", v: "The screen saver page: mode, transition, speed, how long each icon and pattern stays up, and which pattern." },
  { k: "Colors", v: "LED color calibration — see below." },
  { k: "leds 90°", v: "A quarter turn clockwise per tap, for however the matrix sits in the case. Saved per device." },
  { k: "Update", v: "Where to open the upload page, and the progress of an upload." },
];

export const SAVER_ROWS = [
  { k: "show", v: "slideshow › patterns › mixed" },
  { k: "transition", v: "the nine transitions, in order" },
  { k: "speed", v: "1 – 20" },
  { k: "icon time", v: "2, 3, 4, 6, 8, 10, 15, 20, 30, 60 seconds" },
  { k: "pattern", v: "one of the 16, or shuffle all" },
  { k: "pattern time", v: "10, 20, 30, 45, 60 seconds, 2 minutes, 5 minutes" },
];

export const COLORS_NOTES = [
  "Palette colors are **screen** colors. This page tunes how they reach the LEDs, which are a different animal entirely.",
  "The same 8×8 test card shows on the screen and on the matrix. The card button cycles **colors**, **greys** (64 even steps — an even ramp on screen should look even on the LEDs) and a page per eight **families**.",
  "**gamma**, **red / green / blue** and **brightness** change the LEDs live and save when you let go. **Reset** puts the build's defaults back.",
  "Tune by eye until the two look alike. Each handheld gets its own numbers.",
];

// ------------------------------------------------------------------ guide: update

export const UPDATE_STEPS = [
  "**It's already running.** The handheld serves its own upload page whenever it is on WiFi, and announces itself as `8x8-labz`. There is nothing to switch on.",
  "**Open it.** `http://8x8-labz.local`, or the address on **Settings › update**. The page says which firmware is running, which board build it is, and which slot it will write.",
  "**Pick the file.** The `.bin` from the handheld's `builds/` folder, named for this board. Press upload and watch the bar — it moves on the page and on the handheld.",
  "**It reboots itself.** The image goes into the app slot that isn't running, then the board restarts into it. Keep it powered until it does.",
];

export const UPDATE_NOTE =
  "**Settings › update only reports.** It doesn't start or stop anything, and you don't need to be on that screen for an upload to work. Syncing pauses only once an upload actually begins.";

export const UPDATE_WARN =
  "**The file name has to name this board's build.** The other panel variant's image inverts the display, and the only way back from that is a USB flash — so the handheld refuses anything that doesn't carry its own variant. Don't rename a file to get past it. A refused or failed upload changes nothing: the board keeps the firmware it has.";

// ------------------------------------------------------------------ guide: fixes

export const FIXES = [
  {
    title: "Black shows as white",
    body: "The wrong board build. The two CYD variants look identical and differ by one flag: micro-USB panels want inversion on, USB-C panels want it off. It can't be fixed at runtime, and it can't be fixed over WiFi either, because the board will only accept an image named for its own variant. Flash the right one over USB.",
  },
  {
    title: "Which build does this board need?",
    body: "Reset it and watch the serial port at 115200. `[boot]` lines mean LED data is on the CN1 pin; boot ROM noise and then byte soup means it's one of the `-tx` builds, with data on the serial pin. After that the panel tells you the rest — if black comes out white, it's the other inversion.",
  },
  {
    title: "Browse is empty",
    body: "Sync hasn't finished. Check the dot on Home and the lines at the bottom of **Settings**: no server means the URL or key never saved, and a sync problem means it reached the catalog and was turned away — usually a device key that's been deleted or mistyped. Make a new one on the devices page.",
  },
  {
    title: "Taps land next to what I meant",
    body: "**Settings › Touch**, with a stylus — the panel is resistive and likes a point. If taps land mirrored or rotated rather than just offset, that's not calibration, it's the firmware's touch mapping.",
  },
  {
    title: "Edits aren't uploading",
    body: "They're queued on the device and go out before each sync, so they survive reboots. Check the handheld is still pointed at the catalog the edit was drawn against — an edit only ever uploads to the server it was made on, by design. **Settings › Sync** forces an attempt.",
  },
  {
    title: "The LEDs look nothing like the screen",
    body: "**Settings › Colors**, and look at the greys card: an even ramp on the screen should look even on the matrix. Raise gamma if the dark shades crush together, trim a channel if the whites are tinted.",
  },
  {
    title: "`8x8-labz.local` doesn't resolve",
    body: "Some networks block mDNS. **Settings › update** shows the numeric address, and your router's client list will have it under that name.",
  },
  {
    title: "It reboots during a sync",
    body: "Memory. There's no PSRAM, and a secure connection wants about 50 KB free. Every screen except Home is built on entry and freed on exit for exactly this reason, and the Settings lines report the free memory at the last sync.",
  },
];
