// Every tinyradar fact the three pages share: what it is, setup, the radar's
// web page, the range button, the looks, updates and the fixes.
// Keep it in step with the radar repo (private, kpow/ESP32-Plane-Radar):
// README.md, include/config.h, src/services/wifi_setup.cpp (setup hotspot and
// resets), src/ui/status_screens.cpp (the round screen's words), web/index.html
// (the radar's own web page), docs/ota-plan.md and
// ESP32-Plane-Radar-enclosure/v2/ASSEMBLY.md.
// Checked against main 01d1e42 plus the tinyradar rename (PR #9), Nov 1, 2026.
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
    { k: "Brain", v: "an ESP32-S3 with 8 MB of flash, on your home Wi-Fi." },
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
    { k: "Settings", v: "location, map, look, range, units, updates and Wi-Fi." },
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

// ------------------------------------------------------------------ guide (/tinyradar/guide)

export const GUIDE_TOC: TocItem[] = [
  { id: "plugin", name: "plug it in" },
  { id: "wifi", name: "Wi-Fi setup" },
  { id: "location", name: "your location and map" },
  { id: "page", name: "the web page" },
  { id: "button", name: "the range button" },
  { id: "looks", name: "looks" },
  { id: "update", name: "updates" },
  { id: "help", name: "if something's off" },
  { id: "reset", name: "change Wi-Fi or start over" },
];

export const PLUGIN_STEPS: string[] = [
  "Plug a USB-C cable into the radar's USB-C port, and the other end into a USB charger.",
  "Give it a few seconds. The first time, the round screen turns **yellow** and says **Wi-Fi setup**. That's the next step.",
];

export const PLUGIN_NOTE =
  "There's no power switch. Leave it plugged in. It remembers your Wi-Fi, location, map and settings when it's unplugged.";

export const WIFI_STEPS: string[] = [
  "On your phone, open Wi-Fi settings and join the network **TinyRadar-Setup**. The radar's screen shows the name too.",
  "A setup page opens by itself. If it doesn't, open a browser and go to `192.168.4.1`.",
  "Pick your home Wi-Fi and type its password. It needs a **2.4 GHz** network. 5 GHz-only networks won't show up.",
  "Tap **Connect my radar**. The page says **Saved!** and the TinyRadar-Setup network goes away.",
  "Put your phone back on your home Wi-Fi. In about a minute the round screen shows **Set your location** and the address `tinyradar.local`.",
];

export const WIFI_SCREEN: { k: string; v: string }[] = [
  { k: "Wi-Fi setup", v: "Yellow. It's waiting for you to join **TinyRadar-Setup**." },
  { k: "Connecting to", v: "It's joining your Wi-Fi." },
  { k: "Set your location", v: "It's online. Open `tinyradar.local` on a phone or laptop to finish." },
  { k: "Could not connect", v: "Unplug it, plug it back in, then join **TinyRadar-Setup** again. Usually the password was wrong." },
];

export const LOCATION_STEPS: string[] = [
  "On a phone or laptop on your home Wi-Fi, open `tinyradar.local`. If it doesn't open, type the number the radar shows under it, like `192.168.1.40`.",
  "The page asks **Where is your radar?** Type your town, city or ZIP code under **Find your town**, then **Search**.",
  "Or drag the map so the circle sits on your home. Zoom in with **+** for a closer spot.",
  "Pick **Miles** or **Kilometres**.",
  "Tap **Use this spot**.",
  "The page draws a map of your area and sends it to the radar. About 30 seconds. Keep the page open.",
  "**All set.** Tap **Show me the planes**.",
];

export const PASTE_NOTE =
  "**Paste coordinates instead.** In Google Maps or Apple Maps, press and hold on your home, copy the numbers, and paste them into **Or paste coordinates**. Like `43.0731, -89.4012`.";

export const LOCATION_NOTES: string[] = [
  "Until it has a location, the radar shows its rings and sweep but no planes, with a small **Set your location** card. The card goes away once you save a location.",
  "Drawing the map needs internet on your phone or laptop. **Skip, draw it later** is fine: the planes still show, just without the map.",
  "The map is only used by the **Day** and **Dusk** looks.",
  "Moved? Settings › **Location** › **Change location…**. Saving a new spot redraws the map.",
];

export const PAGE_TABS: { k: string; v: string }[] = [
  { k: "Radar", v: "The planes, live, the same as the round screen. Tap one for its route, photo and details." },
  { k: "List", v: "Every plane nearby as a list. Sort by distance, height or flight." },
  { k: "Settings", v: "Everything else. A dot on it means an update is ready." },
  { k: "Key", v: "What the colours mean." },
];

export const SETTINGS_ROWS: { k: string; v: string }[] = [
  { k: "Location", v: "Where your radar is, and its map. **Draw the map** or **Redraw map** here." },
  { k: "Radar screen", v: "The look, the range and miles or kilometres. Runway lines on or off." },
  { k: "This page", v: "How this page looks and which planes it shows. Saved in this browser only." },
  { k: "Updates", v: "The version it runs, and new ones. See [updates](#update)." },
  { k: "Wi-Fi", v: "Its network, signal and addresses. **Change Wi-Fi…** lives here." },
  { k: "About and help", v: "Addresses, the colour key, credits, and Advanced: restart and factory reset." },
];

export const PAGE_NOTES: string[] = [
  "Settings marked **On your radar** change the radar itself. **Only this page** settings stay in the browser you're using.",
  "Bookmark `tinyradar.local`. Some phones, mostly older Android ones, can't open `.local` addresses: use the number under **Wi-Fi** › **Number address** instead.",
  "Can't reach your radar? Is it plugged in, and is your phone on the same Wi-Fi?",
];

export const BUTTON_ROWS: { k: string; v: string }[] = [
  { k: "Press", v: "The next range. Six of them, 5 to 75 km on the third ring, then back to the closest. The web page follows along." },
  { k: "Hold 1 second", v: "Shows the radar's web address on the screen for 15 seconds." },
  { k: "Press while the address shows", v: "Closes the address screen and goes back to the planes." },
];

export const BUTTON_NOTE =
  "The range sticks: it's saved on the radar. The same six steps are under Settings › **Radar screen** › **Ring distance**.";

export const LOOKS: { name: string; bg: string; ring: string; plane: string; water?: string; note: string }[] = [
  { name: "Day", bg: "#E8E4D6", ring: "#5A8C6E", plane: "#0000A0", water: "#96BADC", note: "uses your map" },
  { name: "Dusk", bg: "#0A1014", ring: "#185A30", plane: "#ffffff", water: "#122C4A", note: "uses your map" },
  { name: "Classic", bg: "#040A1C", ring: "#106420", plane: "#FF2020", note: "classic radar" },
  { name: "Green", bg: "#000000", ring: "#0E5A2C", plane: "#1DFF86", note: "classic radar" },
  { name: "Amber", bg: "#0C0701", ring: "#6E4212", plane: "#FFB23C", note: "classic radar" },
  { name: "Night", bg: "#000000", ring: "#1A3E24", plane: "#49C46B", note: "classic radar" },
  { name: "Glow", bg: "#021C0D", ring: "#1C6E42", plane: "#2EFFA2", note: "classic radar" },
];

export const LOOK_STEPS: string[] = [
  "Settings › **Radar screen** › **Look**.",
  "Tap one. The round screen changes in a second or two.",
  "**Day** and **Dusk** need your map. If there isn't one yet, they say **Needs your map**: draw it under Settings › Location.",
];

export const MAP_CREDIT = "Map data © OpenStreetMap contributors © OpenMapTiles, tiles by OpenFreeMap.";

export const UPDATE_STEPS: string[] = [
  "Open `tinyradar.local`. The page checks for updates every time it opens. A dot on **Settings** means one is ready.",
  "Settings › **Updates** › **Install update …**. About 2 minutes.",
  "Keep the page open and the radar plugged in. The round screen shows **Updating**, a ring filling up and **Don't unplug**.",
  "It restarts once, then checks the new version works. That can take up to 5 minutes.",
  "**Updated.** Your location, map and settings are kept.",
];

export const UPDATE_SAFE: string[] = [
  "If the update is interrupted (page closed, Wi-Fi drop, power cut), the radar keeps its old version.",
  "If a new version can't get back on Wi-Fi within 5 minutes, the radar quietly goes back to the old one. The page says **Went back to …** and won't offer that version again.",
];

export const FIXES: { title: string; body: string }[] = [
  {
    title: "TinyRadar-Setup doesn't show up on my phone",
    body: "It's only there while the screen is yellow and says **Wi-Fi setup**. Unplug the radar and plug it back in, wait a few seconds, then look again.",
  },
  {
    title: "My home Wi-Fi isn't in the list",
    body: "The radar needs a 2.4 GHz network. Many routers have both: pick the one without 5G or 5 GHz in its name. **Look for networks again** refreshes the list.",
  },
  {
    title: "The screen says Could not connect",
    body: "Usually a wrong password. Unplug the radar, plug it back in, then join **TinyRadar-Setup** and pick your Wi-Fi again.",
  },
  {
    title: "tinyradar.local won't open",
    body: "Check your phone is on the same Wi-Fi as the radar. Some phones can't open `.local` addresses: type the number the radar shows instead. Hold the range button 1 second to see it.",
  },
  {
    title: "No planes",
    body: "No location yet? The screen says **Set your location**. Otherwise there may be none nearby right now: press the range button to look farther.",
  },
  {
    title: "Day and Dusk show no map",
    body: "The map isn't drawn yet, or it's for your old spot. Settings › **Location** › **Draw the map**. It needs internet on your phone or laptop.",
  },
  {
    title: "The power went out",
    body: "Nothing to do. The radar tries your Wi-Fi again and again until the router is back. A slow router is picked up within about 4 minutes.",
  },
  {
    title: "An update didn't install",
    body: "The radar is still on its old version, and nothing is broken. Try again later. No dot on Settings? It's up to date.",
  },
  {
    title: "It says Can't reach the update site",
    body: "The phone or laptop you're using needs internet to check. The radar is fine.",
  },
];

export const CHANGE_WIFI_STEPS: string[] = [
  "Settings › **Wi-Fi** › **Change Wi-Fi…**.",
  "The radar restarts into setup. Its screen turns yellow.",
  "On your phone, join **TinyRadar-Setup**, pick the new network and type its password, as in [Wi-Fi setup](#wifi).",
];

export const CHANGE_WIFI_NOTE = "Changing Wi-Fi keeps the location, units and map. New router, or moved house: this is the one to use.";

export const RESET_STEPS: string[] = [
  "Settings › **About and help** › **Advanced** › **Factory reset…**.",
  "It asks **Erase everything?** and lists what goes: Wi-Fi network and password, location and map, look, range and units.",
  "Tap **Erase and restart**. The screen says **Factory reset**, then **Restarting...**.",
  "It starts up like new, at [Wi-Fi setup](#wifi).",
];

export const RESET_NOTE =
  "Just want it to start fresh? **Restart radar** (in the same Advanced list) is back in about 30 seconds and loses nothing.";

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
  "The page goes through four steps: downloading, sending it to your radar, restarting, checking it works.",
  "The page says **Updated to** {version}. Nothing else to do.",
];

export const FILE_STEPS: string[] = [
  "Download the update file above onto your phone or laptop.",
  "Open `tinyradar.local`, then Settings › **Updates** › **Install from a file…**.",
  "Pick the file. It asks **Install …?**. Tap **Install**.",
];

export const FILE_NOTE =
  "For when the radar's page can't reach kpow.xyz. Only use files from this page: anything else is refused, and nothing changes.";

export const MAKER_STEPS: string[] = [
  "Every board must be the 8 MB ESP32-S3 Super Mini. Check with `esptool.py flash_id`: it must say **8MB**. Note its MAC, since several boards may share your USB ports.",
  "From the radar repo: `pio run -e supermini_s3 -t upload`. Or write the release's `-full.bin` at `0x0`.",
  "If the port won't open: hold BOOT, tap RESET, release BOOT.",
  "Saved Wi-Fi and a stored map survive this. Check **Settings › Updates** shows the version, then do one test update over Wi-Fi.",
];
