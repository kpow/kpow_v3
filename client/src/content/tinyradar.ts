// Every tinyradar fact the three pages share: what it is, setup, the radar's
// web page, the range button, the looks, the light ring, updates and the fixes.
// Keep it in step with the radar repo (private, kpow/ESP32-Plane-Radar):
// README.md, include/config.h, src/services/wifi_setup.cpp (setup hotspot and
// resets), src/ui/status_screens.cpp (the round screen's words), web/index.html
// (the radar's own web page), docs/ota-plan.md and
// ESP32-Plane-Radar-enclosure/v2/ASSEMBLY.md.
// Checked against main fdd62ad (v1.1.0: the 4 MB board and the light ring), Nov 2, 2026.
//
// tinyradar was called Plane Radar until Nov 2026. The repo keeps the old name;
// everything a person sees says tinyradar.
//
// No secrets on these pages: no Wi-Fi names, passwords, IP or MAC addresses, and
// no home coordinates. Examples use obvious placeholders (192.168.1.40, the one
// the radar's own setup page uses).
//
// Rich strings use the inline markup <Rich> renders (components/vizbot/bits.tsx):
// **bold**, `code`, [text](href).

import type { TocItem } from "@/content/vizbot";

export const BUILDLOG_URL = "/builds/radar";

/** What the radar answers to, and its setup hotspot (include/config.h). */
export const HOST = "tinyradar.local";
export const HOTSPOT = "TinyRadar-Setup";
export const HOTSPOT_IP = "192.168.4.1";
/** The example address on every page (the radar's own setup page uses it too). Never a real one. */
export const SAMPLE_IP = "192.168.1.40";

/**
 * Where kpow.xyz keeps the firmware the radar's web page reads. Radars on
 * firmware from before the rename read the same files at /plane-radar/firmware/
 * (server/routes/tinyradar-routes.ts serves both, with CORS).
 */
export const FIRMWARE_DIR = "/tinyradar/firmware/";
export const MANIFEST_URL = FIRMWARE_DIR + "manifest.json";

// ------------------------------------------------------------------ images
// Photos of the first finished unit, from the build log
// (client/public/buildlog/radar/media, synced from kpow-buildlog).

const M = "/buildlog/radar/media/";

export const PHOTOS = {
  front: {
    src: M + "tinyradar-front.jpg",
    w: 1200,
    h: 1600,
    alt: "tinyradar on a cutting mat: a small black cabinet with a lime ring round its screen, planes on a map of the town, a green range button and a lime keyboard on the deck",
  },
  threeQuarter: {
    src: M + "tinyradar-three-quarter.jpg",
    w: 1200,
    h: 1600,
    alt: "tinyradar from the side: the carbon-fibre faceplate, the round screen with planes on it, the green button and the vents in the side",
  },
  faceplate: {
    src: M + "faceplate.jpg",
    w: 1600,
    h: 1200,
    alt: "The faceplate held in a hand: carbon-fibre texture, a lime ring round the screen hole and lime rivets",
  },
  wiring: {
    src: M + "case-v2-wiring.jpg",
    w: 1200,
    h: 1600,
    alt: "The open back of the body, with the wiring and its small white plugs",
  },
  testBodies: {
    src: M + "case-v2-test-bodies.jpg",
    w: 1600,
    h: 1200,
    alt: "The white first case beside three black test bodies of the new one",
  },
} as const;

export const WALKAROUND = {
  src: M + "tinyradar-walkaround.mp4",
  poster: M + "tinyradar-walkaround.jpg",
  w: 1280,
  h: 720,
  label: "A walk round tinyradar: a press of the range button, then the back with its USB-C port",
};

// ------------------------------------------------------------------ overview

export interface Part {
  eyebrow: string;
  title: string;
  bullets: { k: string; v: string }[];
}

export const RADAR_PART: Part = {
  eyebrow: "part 1",
  title: "The radar",
  bullets: [
    { k: "Screen", v: "a 1.28\" round display, 240 × 240, behind a ring in the faceplate." },
    { k: "Brain", v: "an ESP32-S3 Super Mini (4 MB flash, 2 MB PSRAM), on your home Wi-Fi." },
    { k: "Planes", v: "from adsb.fi's public feed, every 3 seconds. Up to 64 at once. No antenna or receiver." },
    { k: "One button", v: "the green range button on the deck. Press it to see farther or closer." },
  ],
};

export const PAGE_PART: Part = {
  eyebrow: "part 2",
  title: "Its web page",
  bullets: [
    { k: "Address", v: "`tinyradar.local`, on any phone or laptop on the same Wi-Fi." },
    { k: "Live", v: "the same planes as the round screen, with a list, routes and photos." },
    { k: "Settings", v: "location, map, look, range, units, the light ring, updates and Wi-Fi." },
    { k: "Map", v: "the page draws a map of your area and saves it on the radar." },
  ],
};

export const SCREEN: { k: string; v: string }[] = [
  { k: "Planes", v: "A shape pointing the way each one flies, with its call sign. In the map looks, the colour is its height." },
  { k: "Rings", v: "The third ring has its distance written on it: 5 to 75 km, or 3 to 47 miles." },
  { k: "The rim", v: "Planes just past the edge wait there as dots, in the direction they are." },
  { k: "Runways", v: "Lines for the big airports near you, with their codes. You can turn them off." },
];

/** Height colours for planes in the Day and Dusk looks (web/index.html ALT_BANDS). */
export const HEIGHT_BANDS: { c: string; l: string }[] = [
  { c: "#ff4900", l: "under 2,000 ft" },
  { c: "#ffb600", l: "2,000–10,000" },
  { c: "#55db00", l: "10,000–20,000" },
  { c: "#00dbdb", l: "20,000–30,000" },
  { c: "#006dff", l: "30,000–40,000" },
  { c: "#ff00ff", l: "above 40,000" },
];

export const HIGHLIGHTS: { icon: "map" | "phone" | "update" | "power" | "pin" | "case"; title: string; body: string; chips: string[] }[] = [
  {
    icon: "map",
    title: "A real map of your town",
    body: "Lakes, rivers and roads, drawn from OpenStreetMap by your phone and saved on the radar. Shown in the Day and Dusk looks.",
    chips: ["Day", "Dusk"],
  },
  {
    icon: "phone",
    title: "Set up from a phone",
    body: "It opens its own Wi-Fi hotspot. Join it, pick your home Wi-Fi, done. No app, no cable.",
    chips: ["Setup"],
  },
  {
    icon: "pin",
    title: "Your sky, not someone else's",
    body: "Search for your town or paste coordinates. It shows nothing until it knows where it is.",
    chips: ["Location"],
  },
  {
    icon: "update",
    title: "Updates that can't brick it",
    body: "One button on its web page. If an update goes wrong, it quietly goes back to the version it had.",
    chips: ["Updates"],
  },
  {
    icon: "power",
    title: "Survives a power cut",
    body: "It keeps trying your Wi-Fi until the router is back up, so it picks up a slow router within about 4 minutes.",
    chips: ["Wi-Fi"],
  },
  {
    icon: "case",
    title: "A little cabinet",
    body: "Four printed parts, four screws and one glue joint. About 8 minutes to put together.",
    chips: ["Case v2"],
  },
];

export const CASE_FACTS: { k: string; v: string }[] = [
  { k: "Printed parts", v: "4: body, faceplate, display clip and the keyboard insert. It was 86 in the first case." },
  { k: "Fasteners", v: "4 M3 self-tapping screws from the back, and 1 glue joint for the keyboard." },
  { k: "Build time", v: "About 8 minutes, down from 60 to 90." },
];

// ------------------------------------------------------------------ the three guide pages
// /tinyradar/guide (set it up), /tinyradar/use (make it yours), /tinyradar/help
// (fix it). Each section: one lead line, one picture, at most 5 steps, at most
// one callout. Settings paths are written once per page with <Crumb>.

/** Old /tinyradar/guide#anchors and where they live now. */
export const MOVED_ANCHORS: Record<string, string> = {
  page: "/tinyradar/use#page",
  button: "/tinyradar/use#button",
  looks: "/tinyradar/use#looks",
  help: "/tinyradar/help",
  reset: "/tinyradar/help#reset",
  update: "/tinyradar/update",
};

// ---------- media
// Captures from a real radar's web page (GET only; Wi-Fi name, place, IP and
// version replaced) and a still from the walkaround video. Committed in
// client/public/images/tinyradar/.

const G = "/images/tinyradar/";

export interface Img {
  src: string;
  w: number;
  h: number;
  alt: string;
}

export const CAPTURES = {
  back: { src: G + "back-usb-c.jpg", w: 600, h: 600, alt: "The back of tinyradar in a hand, a white USB-C cable plugged in at the bottom and a coloured light glowing through the case" },
  deck: { src: G + "deck.jpg", w: 800, h: 600, alt: "The deck of tinyradar: the round green range button on the left, the lime keyboard on the right" },
  settings: { src: G + "ui-settings.jpg", w: 600, h: 830, alt: "The radar's Settings page on a phone: Location, Radar screen, Light ring, This page, Updates, Wi-Fi, About and help. Purple dots mark the ones that change the radar." },
  tabs: { src: G + "ui-tabs.jpg", w: 560, h: 90, alt: "The radar page's four tabs: Radar, List, Settings, Key" },
  looks: { src: G + "ui-looks.jpg", w: 600, h: 662, alt: "Settings, Radar screen, Look: seven tiles, Classic picked" },
  ringTop: { src: G + "ui-ring-top.jpg", w: 600, h: 400, alt: "Light ring settings: on or off, and brightness at 65%" },
  ringEffect: { src: G + "ui-ring-effect.jpg", w: 600, h: 554, alt: "Light ring settings: Radar effects Beam, Pings, Planes; Ambient effects Solid, Breathe, Comet, Scroll, Sparkle; Speed" },
  ringColours: { src: G + "ui-ring-colours.jpg", w: 600, h: 776, alt: "Light ring settings: nine colour sets, and Your colours with plus and minus" },
  wifi: { src: G + "ui-wifi.jpg", w: 600, h: 716, alt: "Settings, Wi-Fi: network, signal, the address tinyradar.local, the number address 192.168.1.40, and Change Wi-Fi" },
  advanced: { src: G + "ui-advanced.jpg", w: 600, h: 350, alt: "Settings, About and help, Advanced: Install from a file, Restart radar, Factory reset" },
  updateReady: { src: G + "ui-update-ready.jpg", w: 600, h: 708, alt: "Settings, Updates: This radar 1.0.0, Version 1.1.0 is ready, Install update 1.1.0" },
} satisfies Record<string, Img>;

/**
 * Photos and clips only the owner's camera can make. `src: null` shows a
 * marked placeholder; set `src` (and `poster` for a clip) to swap one in.
 */
export interface Slot {
  kind: "photo" | "clip";
  what: string;
  src: string | null;
  poster?: string;
  w: number;
  h: number;
  alt: string;
}

export const SLOTS = {
  bootClip: { kind: "clip", what: "4 s: plug in, the beam paints the wordmark, the screen turns yellow", src: null, w: 720, h: 720, alt: "tinyradar starting up" },
  ringBeam: { kind: "clip", what: "5 s loop: the real ring lit in a dim room, Beam following the sweep", src: null, w: 1280, h: 720, alt: "The light ring running Beam in a dim room" },
  ringRadarFx: { kind: "clip", what: "2 short clips: Pings and Planes", src: null, w: 720, h: 720, alt: "The light ring running Pings and Planes" },
  ringAmbient: { kind: "clip", what: "Montage: the 5 ambient effects", src: null, w: 720, h: 720, alt: "The five ambient light ring effects" },
  updating: { kind: "photo", what: "The round screen mid-update: Updating, the ring filling up, Don't unplug", src: null, w: 800, h: 800, alt: "tinyradar's screen during an update" },
} satisfies Record<string, Slot>;

/**
 * Real phone screenshots for Wi-Fi setup. null = the drawn phone (PhoneMock),
 * recreated from the setup page's own styles.
 */
export const PHONE_SHOTS: Record<"wifi" | "portal" | "saved" | "location", string | null> = {
  wifi: null,
  portal: null,
  saved: null,
  location: null,
};

// ---------- /tinyradar/guide: set it up

export const GUIDE_TOC: TocItem[] = [
  { id: "plugin", name: "plug it in" },
  { id: "wifi", name: "Wi-Fi from your phone" },
  { id: "location", name: "tell it where it is" },
  { id: "done", name: "you're done" },
];

export interface Card {
  title: string;
  body: string;
}

export const PLUGIN_CARDS: Card[] = [
  { title: "Cable in the back", body: "USB-C into the back, the other end into any USB charger. A light inside glows through the case." },
  { title: "It wakes up", body: "A few seconds later the beam paints **tinyradar** across the screen." },
  { title: "Yellow means setup", body: "The first time, the screen turns **yellow** and says **Wi-Fi setup**. Next step." },
];

export const PLUGIN_NOTE =
  "There's no power switch. Leave it plugged in. It remembers your Wi-Fi, location, map and settings when it's unplugged.";

export const WIFI_CARDS: Card[] = [
  { title: "Join TinyRadar-Setup", body: "On your phone: Settings › Wi-Fi. The yellow screen shows the name too." },
  { title: "Pick your home Wi-Fi", body: "The setup page opens by itself (or go to `192.168.4.1`). Type the password." },
  { title: "Tap Connect my radar", body: "It says **Saved!** and TinyRadar-Setup goes away." },
  { title: "Back to home Wi-Fi", body: "Put your phone back on your home Wi-Fi. The radar says **Connecting to**." },
  { title: "It shows its address", body: "About a minute later: **Set your location** and `tinyradar.local`." },
];

export const WIFI_KEY: { screen: "setup" | "connecting" | "location" | "failed"; k: string; v: string; bad?: boolean }[] = [
  { screen: "setup", k: "Wi-Fi setup", v: "Waiting for you to join **TinyRadar-Setup**." },
  { screen: "connecting", k: "Connecting to…", v: "Joining your Wi-Fi. Give it a minute." },
  { screen: "location", k: "Set your location", v: "Online. Next: open `tinyradar.local`." },
  {
    screen: "failed",
    k: "Could not connect",
    v: "Usually the password. Unplug, plug back in, then join **TinyRadar-Setup** again.",
    bad: true,
  },
];

export const WIFI_NOTE =
  "**Hold your phone near the radar.** Its setup network is weak on purpose, so it only reaches the room it's in. It needs a **2.4 GHz** home Wi-Fi: 5 GHz-only networks won't show up.";

export const LOCATION_STEPS: string[] = [
  "On a phone or laptop on your home Wi-Fi, open `tinyradar.local`.",
  "It asks **Where is your radar?** Type your town or ZIP under **Find your town**, then **Search**. Or drag the map so the circle sits on your home.",
  "Pick **Miles** or **Kilometres**, then tap **Use this spot**.",
  "It draws a map of your area and sends it to the radar. About 30 seconds: keep the page open. **Skip, draw it later** is fine too.",
  "**All set.** Tap **Show me the planes**.",
];

export const LOCAL_NOTE =
  "**Can't open tinyradar.local?** Check your phone is on the same Wi-Fi. Some phones, mostly older Android ones, can't open `.local` addresses: type the number the radar shows under it instead, like `192.168.1.40`. Bookmark whichever works.";

export const PASTE_NOTE =
  "In Google Maps or Apple Maps, press and hold on your home, copy the numbers, and paste them into **Or paste coordinates**. Like `43.0731, -89.4012`.";

export const DONE_CARDS: { href: string; t: string; d: string }[] = [
  { href: "/tinyradar/use#reading", t: "Read the screen", d: "What the shapes, colours and rings mean." },
  { href: "/tinyradar/use#ring", t: "Light up the ring", d: "Eight lights round the screen. Try them here." },
  { href: "/tinyradar/use#looks", t: "Pick a look", d: "Seven of them, two with your map." },
];

// ---------- /tinyradar/use: make it yours

export const USE_TOC: TocItem[] = [
  { id: "reading", name: "reading the screen" },
  { id: "button", name: "the range button" },
  { id: "looks", name: "looks" },
  { id: "ring", name: "light ring" },
  { id: "page", name: "the web page" },
];

/** Numbered marks on the made-up screen in "reading the screen". x, y in % of the screen. */
export const READING_MARKS: { n: number; x: number; y: number; k: string; v: string }[] = [
  { n: 1, x: 58, y: 20, k: "A plane", v: "Points the way it flies. Its call sign, type and height sit beside it." },
  { n: 2, x: 13, y: 70, k: "Its colour", v: "Its height, in the map looks. The key is below." },
  { n: 3, x: 88, y: 40, k: "The third ring", v: "Its distance is written on it, 3 to 47 miles or 5 to 75 km." },
  { n: 4, x: 9, y: 24, k: "The rim", v: "Planes just past the edge wait there as dots, in the direction they are." },
  { n: 5, x: 29, y: 17, k: "Runways", v: "Lines for big airports near you, with their codes. You can turn them off." },
];

export const BUTTON_ROWS: { k: string; v: string }[] = [
  { k: "Press", v: "The next range. Six of them, 3 to 47 miles (5 to 75 km) on the third ring, then back to the closest. The web page follows along." },
  { k: "Hold 1 second", v: "Shows the radar's web address on the screen for 15 seconds. Press again to close it." },
];

export const BUTTON_NOTE = "The range sticks: it's saved on the radar. The same six steps are in the radar's Settings too.";

/** The three range frames: zoom > 1 = closer in. */
export const RANGE_FRAMES: { label: string; zoom: number; ring: string }[] = [
  { label: "close", zoom: 1.9, ring: "3 mi" },
  { label: "middle", zoom: 1, ring: "9 mi" },
  { label: "far", zoom: 0.42, ring: "31 mi" },
];

export const LOOKS: { name: string; bg: string; ring: string; plane: string; water?: string; note: string }[] = [
  { name: "Day", bg: "#E8E4D6", ring: "#5A8C6E", plane: "#0000A0", water: "#96BADC", note: "uses your map" },
  { name: "Dusk", bg: "#0A1014", ring: "#185A30", plane: "#ffffff", water: "#122C4A", note: "uses your map" },
  { name: "Classic", bg: "#040A1C", ring: "#106420", plane: "#FF2020", note: "classic radar" },
  { name: "Green", bg: "#000000", ring: "#0E5A2C", plane: "#1DFF86", note: "classic radar" },
  { name: "Amber", bg: "#0C0701", ring: "#6E4212", plane: "#FFB23C", note: "classic radar" },
  { name: "Night", bg: "#000000", ring: "#1A3E24", plane: "#49C46B", note: "classic radar" },
  { name: "Glow", bg: "#021C0D", ring: "#1C6E42", plane: "#2EFFA2", note: "classic radar" },
];

export const MAP_CREDIT = "Map data © OpenStreetMap contributors © OpenMapTiles, tiles by OpenFreeMap.";

export const LOOKS_NOTE =
  "**Day** and **Dusk** need your map. No map yet? They say **Needs your map**: draw it under Settings › Location.";

export const RING_DEFAULTS_NOTE = "Out of the box it's Breathe, Radar colours, 35%.";

export const RING_COLOURS_NOTE =
  "Pick one of 9 sets, or up to 4 colours of your own. Beam uses the first colour; Pings and Planes colour each plane by its height.";

export const EMERGENCY_CODES: { code: string; what: string }[] = [
  { code: "7500", what: "hijack" },
  { code: "7600", what: "radio lost" },
  { code: "7700", what: "emergency" },
];

export const LINEUP_STEPS: string[] = [
  "Pick **Beam**.",
  "Under **Line it up**, tap **Turn the ring** and **Direction** until the light follows the sweep on the screen.",
];

/** Numbered marks on the Settings capture: y in % of the image height. */
export const SETTINGS_MARKS: { n: number; y: number; k: string; v: string; dot?: boolean }[] = [
  { n: 1, y: 15, k: "Location", v: "Where it is, and its map.", dot: true },
  { n: 2, y: 26.7, k: "Radar screen", v: "Look, range, miles or km, runways.", dot: true },
  { n: 3, y: 38, k: "Light ring", v: "Effect, colours, brightness, alerts.", dot: true },
  { n: 4, y: 49.4, k: "This page", v: "How this page looks. This browser only." },
  { n: 5, y: 60.8, k: "Updates", v: "Its version. A dot means a new one is ready.", dot: true },
];

export const SETTINGS_MORE =
  "Below those: **Wi-Fi** (its network, its number address, **Change Wi-Fi…**) and **About and help** (the colour key, credits, restart and factory reset).";

export const TAB_ROWS: { k: string; v: string }[] = [
  { k: "Radar", v: "The planes, live. Tap one for its route and photo." },
  { k: "List", v: "Every plane nearby. Sort by distance, height or flight." },
  { k: "Settings", v: "Everything else, below." },
  { k: "Key", v: "What the colours mean." },
];

// ---------- /tinyradar/help: fix it

export const HELP_TOC: TocItem[] = [
  { id: "setting-up", name: "setting up" },
  { id: "screen", name: "on the screen" },
  { id: "moved", name: "moved or new router" },
  { id: "reset", name: "start over" },
  { id: "itself", name: "things that fix themselves" },
];

export interface Fix {
  q: string;
  a: string;
}

export const HELP_SETUP: Fix[] = [
  {
    q: "TinyRadar-Setup isn't on my phone",
    a: "It's only there while the screen is yellow. Unplug, plug back in, and hold your phone near the radar. [Wi-Fi setup](/tinyradar/guide#wifi)",
  },
  {
    q: "My home Wi-Fi isn't on the setup page",
    a: "It needs 2.4 GHz: pick the one without 5G in its name. **Look for networks again** refreshes the list.",
  },
  {
    q: "tinyradar.local won't open",
    a: "Same Wi-Fi as the radar? Hold the range button 1 second to see its number address, and type that. [More](/tinyradar/guide#location)",
  },
];

export const HELP_SCREEN: Fix[] = [
  {
    q: "No planes",
    a: "A **Set your location** card means it doesn't know where it is yet: [tell it](/tinyradar/guide#location). Otherwise none are near right now: press the range button to look farther.",
  },
  {
    q: "Day and Dusk show no map",
    a: "It isn't drawn yet, or it's for your old spot. Settings › Location › **Draw the map**. Your phone needs internet for it. [Looks](/tinyradar/use#looks)",
  },
];

export const MOVED_STEPS: string[] = [
  "Open `tinyradar.local`, then Settings › **Wi-Fi** › **Change Wi-Fi…**.",
  "The radar restarts into setup. Its screen turns yellow.",
  "On your phone, join **TinyRadar-Setup** and pick the new network, as in [Wi-Fi setup](/tinyradar/guide#wifi).",
];

export const MOVED_NOTE = "It keeps its location, units and map. Moved house too? Change the location after: Settings › Location.";

export const RESET_STEPS: string[] = [
  "Settings › **About and help** › **Advanced**.",
  "Try **Restart radar** first. It's back in about 30 seconds and loses nothing.",
  "Still wrong? **Factory reset…** asks **Erase everything?**: Wi-Fi, location and map, look, range and units.",
  "Tap **Erase and restart**. The screen says **Factory reset**, then starts like new, at [Wi-Fi setup](/tinyradar/guide#wifi).",
];

export const HELP_ITSELF: Fix[] = [
  {
    q: "The power went out",
    a: "Nothing to do. It keeps trying your Wi-Fi until the router is back, and picks up a slow one within about 4 minutes.",
  },
  {
    q: "An update didn't work",
    a: "The radar stays on, or goes back to, the version it had. Nothing is broken. [Updates](/tinyradar/update#safe)",
  },
];

// ------------------------------------------------------------------ update (/tinyradar/update)

/** What /tinyradar/firmware/manifest.json holds (radar repo, .github/workflows/release.yml). */
export interface Manifest {
  version: string;
  notes?: string;
  builds: { "s3-4mb"?: { url: string; size: number; md5: string } };
}

export const INSTALL_STEPS: string[] = [
  "On a phone or laptop on the radar's Wi-Fi, open `tinyradar.local`.",
  "A dot on **Settings** means this version is ready. Tap **Settings** › **Updates**.",
  "Tap **Install update** {version}. Keep the page open and the radar plugged in. About 2 minutes.",
  "The page goes through four steps: downloading, sending it to your radar, restarting, checking it works. The round screen says **Updating** and **Don't unplug**.",
  "It restarts once and checks the new version works, up to 5 minutes. Then **Updated to** {version}. Your location, map and settings are kept.",
];

export const UPDATE_SAFE: string[] = [
  "If the update is interrupted (page closed, Wi-Fi drop, power cut), the radar keeps its old version.",
  "If a new version can't get back on Wi-Fi within 5 minutes, the radar quietly goes back to the old one. The page says **Went back to …** and won't offer that version again.",
];

/** Update problems, here only (the help page links to this). */
export const UPDATE_FIXES: { q: string; a: string }[] = [
  { q: "An update didn't install", a: "The radar is still on its old version, and nothing is broken. Try again later. No dot on Settings? It's up to date." },
  { q: "It says Can't reach the update site", a: "The phone or laptop you're using needs internet to check. The radar is fine." },
  { q: "Older 8 MB radars", a: "The first few radars had an 8 MB board. They aren't offered 1.1.0: it's built for the 4 MB tinyradar board." },
];

export const FILE_STEPS: string[] = [
  "Download the update file above onto your phone or laptop.",
  "Open `tinyradar.local`, then Settings › **Updates** › **Install from a file…**.",
  "Pick the file. It asks **Install …?**. Tap **Install**.",
];

export const FILE_NOTE =
  "For when the radar's page can't reach kpow.xyz. Only use files from this page: anything else is refused, and nothing changes.";

export const MAKER_STEPS: string[] = [
  "Every board must be the ESP32-S3 Super Mini with an S3FH4R2 (4 MB flash, 2 MB PSRAM). Check with `esptool.py flash_id`: it must say **4MB**. Note its MAC, since several boards may share your USB ports.",
  "From the radar repo: `pio run -e supermini_s3 -t upload`. Or write the release's `tinyradar-s3-4mb-<tag>-full.bin` at `0x0`.",
  "If the port won't open: hold BOOT, tap RESET, release BOOT.",
  "Saved Wi-Fi and a stored map survive this. Check **Settings › Updates** shows the version, then do one test update over Wi-Fi.",
];
