// Every vizBot fact the three pages share: boards, gestures, dock tiles,
// settings, the guide's steps and fixes. Keep it in step with the firmware
// (github kpow/vizpow, vizbot/): BOARD_TYPE tokens in config.h, the touch UI in
// touch_ui.h, the OTA filename check in ota_update.h.
//
// Rich strings use a tiny inline markup rendered by <Rich> in
// components/vizbot/bits.tsx: **bold**, `code`, [text](href).

export type BoardId = "lcd169" | "lcd13" | "cores3" | "stackchan";

/** The firmware version these pages describe. The live latest version comes from /api/vizbot/releases. */
export const DOC_VERSION = "3.4.0";

export const REPO_URL = "https://github.com/kpow/vizpow";
export const RELEASES_URL = "https://github.com/kpow/vizpow/releases";
export const ISSUES_URL = "https://github.com/kpow/vizpow/issues";

export interface Board {
  id: BoardId;
  /** Full hardware name */
  name: string;
  short: string;
  /** Second line under the short name on cards */
  sub: string;
  /** BOARD_TYPE: the token the bot's update page looks for in the file name */
  token: string;
  /** Photo-free "is this mine?" description */
  hint: string;
  feats: string[];
  touch: boolean;
  notes: string[];
}

export const BOARDS: Board[] = [
  {
    id: "lcd169",
    name: "Waveshare ESP32-S3-Touch-LCD-1.69",
    short: "Waveshare 1.69″",
    sub: "ESP32-S3-Touch-LCD-1.69",
    token: "esp32s3-lcd169",
    hint: "Small portrait touch screen, living in the lime-green dino case.",
    feats: ["Touch", "Portrait 240×280", "Motion sensor"],
    touch: true,
    notes: [
      "Everything in this guide applies. The dock and sheets rise from the bottom of the portrait screen.",
      "Give it a quick shake and it gets dizzy.",
    ],
  },
  {
    id: "lcd13",
    name: "Waveshare ESP32-S3-LCD-1.3",
    short: "Waveshare 1.3″",
    sub: "ESP32-S3-LCD-1.3",
    token: "esp32s3-lcd13",
    hint: "Square 240×240 screen with no touch. Built-in battery charger.",
    feats: ["No touch", "Square 240×240", "Battery"],
    touch: false,
    notes: [
      "No touch screen, so the web panel does everything.",
      "Shake it for a reaction. Keep shaking for about half a second to flip to the weather view; do it again to come back.",
      "It has a battery charger built in, so it runs off a battery and charges over USB-C.",
    ],
  },
  {
    id: "cores3",
    name: "M5Stack CoreS3",
    short: "M5Stack CoreS3",
    sub: "M5Stack CoreS3",
    token: "m5cores3",
    hint: "The little M5Stack cube with a 2″ landscape touch screen.",
    feats: ["Touch", "Landscape 320×240", "Speaker + mics"],
    touch: true,
    notes: [
      "Landscape screen: the dock sits on two side rails and settings open as a list with the page beside it.",
      "It has a speaker and microphones. Turn on **Audio FX** in Settings › Light & sound and the scenes move to music; Reactivity sets how much.",
    ],
  },
  {
    id: "stackchan",
    name: "Stackchan (CoreS3 + robot base)",
    short: "Stackchan",
    sub: "CoreS3 + robot base",
    token: "stackchan",
    hint: "A CoreS3 sitting on the robot base, with a head that moves.",
    feats: ["Moving head", "12-LED ring", "Head touch", "Battery"],
    touch: true,
    notes: [
      "The head moves on its own when it's idle and reacts when you touch the top of it.",
      "Head in the dock: nod, shake, look up or down, center, Chill mode.",
      "Base LEDs and LED mode live in Settings › Light & sound; battery level in System.",
      "It takes the `stackchan` file, not the `m5cores3` one, even though it's a CoreS3 inside.",
      "Head stopped moving after an update? Power it fully off (hold the bottom button about 6 seconds) and back on.",
    ],
  },
];

export const BOARD_BY_ID: Record<BoardId, Board> = Object.fromEntries(BOARDS.map((b) => [b.id, b])) as Record<
  BoardId,
  Board
>;

export function isBoardId(v: unknown): v is BoardId {
  return typeof v === "string" && v in BOARD_BY_ID;
}

/** The file names the build publishes (vizbot/name_firmware.py). */
export const otaFileName = (b: Board, version: string) => `vizbot-${b.token}-v${version}.bin`;
export const factoryFileName = (b: Board, version: string) => `vizbot-${b.token}-v${version}-factory.bin`;

// ------------------------------------------------------------------ screens
// Real device renders at 2x. Portrait = 1.69 (240×280), landscape = CoreS3 (320×240).

export type ScreenKey =
  | "home" | "dock" | "scene" | "light" | "mood" | "settings" | "look" | "connect"
  | "s3dock" | "s3scene" | "s3mood" | "s3sound" | "s3head";

const S = "/images/vizbot/screens/";
export const SCREENS: Record<ScreenKey, string> = {
  home: S + "169-home.png",
  dock: S + "169-dock.png",
  scene: S + "169-scene.png",
  light: S + "169-light.png",
  mood: S + "169-mood.png",
  settings: S + "169-settings.png",
  look: S + "169-look.png",
  connect: S + "169-connect.png",
  s3dock: S + "s3-dock.png",
  s3scene: S + "s3-scene.png",
  s3mood: S + "s3-mood.png",
  s3sound: S + "s3-sound.png",
  s3head: S + "s3-head.png",
};

// ------------------------------------------------------------------ intro

export interface Feature {
  screen: ScreenKey;
  frame: "dino" | "landscape";
  title: string;
  body: string;
  caption: string;
}

export const FEATURES: Feature[] = [
  {
    screen: "mood",
    frame: "dino",
    title: "A face with moods",
    body: "25 expressions and three personalities: Chill, Hyper and Grumpy. Left alone it looks around, blinks and talks to itself in speech bubbles. Tap it and it reacts.",
    caption: "mood sheet · 1.69",
  },
  {
    screen: "s3scene",
    frame: "landscape",
    title: "Light shows behind the eyes",
    body: "16 animated scenes with color palettes and a kaleidoscope, drawn behind the face. Swipe sideways to change it, or let it cycle. On a CoreS3 they can move to the music.",
    caption: "scene switcher · CoreS3",
  },
  {
    screen: "dock",
    frame: "dino",
    title: "Clock and weather",
    body: "On your WiFi it keeps the time and shows the local weather with a 3-day forecast. The quick dock puts both one swipe away.",
    caption: "quick dock · 1.69",
  },
  {
    screen: "connect",
    frame: "dino",
    title: "Friends and LEDs",
    body: "It can send its speech bubbles and weather to a WLED light matrix, and it notices other vizBots nearby.",
    caption: "settings › connect · 1.69",
  },
];

export type GestureIcon = "tap" | "long" | "up" | "down" | "side" | "wait";

export const GESTURES_SHORT: { icon: GestureIcon; k: string; v: string }[] = [
  { icon: "tap", k: "Tap", v: "poke it" },
  { icon: "up", k: "Swipe up or long-press", v: "the quick dock" },
  { icon: "side", k: "Swipe left or right", v: "change the scene" },
  { icon: "down", k: "Swipe down", v: "close" },
];

// ------------------------------------------------------------------ guide

export const TOC: { id: string; name: string; subs: string[]; boards?: BoardId[] }[] = [
  { id: "setup", name: "get it online", subs: [] },
  {
    id: "touch",
    name: "the touch screen",
    subs: ["gestures", "the quick dock", "scene, mood, light", "settings", "CoreS3 and Stackchan"],
    boards: ["lcd169", "cores3", "stackchan"],
  },
  { id: "web", name: "the web panel", subs: [] },
  { id: "update", name: "updating firmware", subs: [] },
  { id: "boards", name: "board notes", subs: [] },
  { id: "help", name: "if something's off", subs: [] },
];

export const SETUP_STEPS: string[] = [
  "**Plug it in.** It runs a quick self-check, then shows its face. A new bot has no WiFi yet, so it starts its own hotspot named `vizBot-XXXX`. The four characters are unique to your bot.",
  "On your phone, join `vizBot-XXXX`. The password is `12345678`. A setup page opens by itself; if it doesn't, go to `192.168.4.1`.",
  "Tap **Scan Networks**, pick your home WiFi, type its password and tap **Connect**.",
  "When it's connected, the hotspot stays up for about 30 seconds, then switches off. Your phone goes back to your home WiFi.",
  "Open `http://vizbot-xxxx.local` with the same four characters. That's your bot's web panel. Bookmark it.",
];

export const GESTURES: { icon: GestureIcon; k: string; v: string }[] = [
  { icon: "tap", k: "Tap the face", v: "Poke it. It reacts." },
  { icon: "up", k: "Swipe up, or long-press", v: "Open the quick dock." },
  { icon: "side", k: "Swipe left or right", v: "Step to the previous or next scene." },
  { icon: "down", k: "Swipe down", v: "Close whatever is open. A tap on the face does too." },
  { icon: "wait", k: "Leave it", v: "Sheets close by themselves after about 10 seconds untouched, settings pages after 30." },
];

/** Category hues from touch_ui.h. Only used where the page mirrors the bot's own UI. */
export const CAT = {
  mood: "#FFD23F",
  look: "#FF5FD2",
  info: "#3FD8FF",
  light: "#FF9A3C",
  connect: "#3DDC84",
  system: "#C3CEDB",
} as const;
export type Cat = keyof typeof CAT;

export const DOCK_TILES: { name: string; cat: Cat; desc: string }[] = [
  { name: "Mood", cat: "mood", desc: "personality and expressions" },
  { name: "Scene", cat: "look", desc: "the scene switcher" },
  { name: "Weather", cat: "info", desc: "the weather view" },
  { name: "Clock", cat: "info", desc: "clock on or off" },
  { name: "Light", cat: "light", desc: "screen brightness" },
  { name: "More", cat: "system", desc: "all settings" },
];

export const SHEETS: { screen: ScreenKey; name: string; body: string }[] = [
  {
    screen: "scene",
    name: "Scene",
    body: "Arrows step through 16 scenes and plain black. Pick a palette, switch Pixel or Hi-res, or turn Auto on to cycle. Choosing a scene by hand turns Auto off.",
  },
  { screen: "mood", name: "Mood", body: "Choose Chill, Hyper or Grumpy, then tap any of the 25 expressions to wear it." },
  {
    screen: "light",
    name: "Light",
    body: "Drag the slider or tap − and + for screen brightness. Night, Day and Max jump straight there.",
  },
];

export const SETTINGS: { name: string; cat: Cat; desc: string }[] = [
  { name: "Look", cat: "look", desc: "Scene, palette, kaleidoscope, face color" },
  { name: "Mood", cat: "mood", desc: "Personality, how often it rotates, expression" },
  { name: "Info", cat: "info", desc: "Weather, clock, time zone" },
  { name: "Light", cat: "light", desc: "Screen brightness. Volume and Audio FX on CoreS3; base LEDs on Stackchan" },
  { name: "Connect", cat: "connect", desc: "Network, address, IP, signal, nearby bots. Offline, the hotspot steps" },
  { name: "System", cat: "system", desc: "Firmware version, name, uptime, memory, battery. Restart and Power off need a 1.5 s hold" },
];

export const LANDSCAPE_SHOTS: { screen: ScreenKey; caption: string; boards: BoardId[] }[] = [
  { screen: "s3dock", caption: "dock: two side rails", boards: ["cores3", "stackchan"] },
  { screen: "s3scene", caption: "scene", boards: ["cores3", "stackchan"] },
  { screen: "s3mood", caption: "mood", boards: ["cores3", "stackchan"] },
  { screen: "s3sound", caption: "settings › light & sound", boards: ["cores3", "stackchan"] },
  { screen: "s3head", caption: "settings › head (stackchan)", boards: ["stackchan"] },
];

export type PanelIcon =
  | "smile" | "chat" | "robot" | "palette" | "chip" | "cloud" | "wifi" | "grid" | "speaker" | "led";

export const PANEL: { icon: PanelIcon; name: string; desc: string; boards?: BoardId[] }[] = [
  { icon: "smile", name: "Expressions", desc: "Tap any of the 25 faces." },
  { icon: "chat", name: "Say something", desc: "Type a message; it shows up in a speech bubble." },
  { icon: "robot", name: "Personality", desc: "Pick one, or rotate every few minutes." },
  { icon: "palette", name: "Appearance", desc: "Face color, background, scene, kaleidoscope, audio reactivity." },
  { icon: "chip", name: "Device", desc: "Brightness, time zone, hi-res, firmware version and Update." },
  { icon: "cloud", name: "Weather & Info", desc: "Set your location by zip code or city." },
  { icon: "wifi", name: "WiFi", desc: "Scan, connect, forget a network, set the device name." },
  { icon: "grid", name: "WLED", desc: "Send speech, weather and sprites to a WLED LED matrix." },
  { icon: "speaker", name: "Sounds", desc: "CoreS3 and Stackchan only.", boards: ["cores3", "stackchan"] },
  { icon: "led", name: "StackChan", desc: "Move the head, base LEDs, power off. Stackchan only.", boards: ["stackchan"] },
];

/** Update steps; `{ota}` becomes the example OTA file name. */
export const UPDATE_STEPS: string[] = [
  "Download the update file for your board from [Downloads](/vizbot/releases). It's the one named {ota}: your board's name in the middle, **no** `-factory` on the end.",
  "Open `http://vizbot-xxxx.local/update`, or tap **Update** next to Firmware in the web panel's Device section.",
  "Choose that `.bin` file and tap **Upload**. Keep the page open until it finishes.",
  "The bot restarts by itself. Check the new version in **Settings › System** or in the web panel.",
];

export const FIXES: { title: string; body: string; boards?: BoardId[] }[] = [
  {
    title: "I can't open vizbot-xxxx.local",
    body: "Swipe up on the face: the dock shows the address at the top. **Settings › Connect** shows the IP too; type that instead, like `http://10.0.0.142`. Some Android phones and older Windows PCs don't understand .local names. The 1.3 shows its address on its start-up screen.",
  },
  {
    title: "It started its own hotspot again",
    body: "It couldn't join your WiFi: a new password, a 5 GHz-only network, or it's too far from the router. Join `vizBot-XXXX` and set up WiFi again.",
  },
  {
    title: "The update says “Wrong board type”",
    body: "The file is for a different board. The name has to contain your board's token, like `esp32s3-lcd169`; the update page shows which one it expects. A Stackchan needs the `stackchan` file, not `m5cores3`.",
  },
  {
    title: "The update stopped partway",
    body: "Nothing changes until the whole file arrives, so the bot keeps the version it had. Reload the update page and try again.",
  },
  {
    title: "It's too bright at night",
    body: "Swipe up, tap **Light**, then **Night**. On the 1.3, use Brightness in the web panel.",
  },
  {
    title: "The Stackchan head stopped moving after an update",
    body: "Power it fully off: hold the bottom button about 6 seconds (or hold **Power off** in Settings › System). Then switch it back on.",
    boards: ["stackchan"],
  },
];

// ------------------------------------------------------------------ releases

export const INSTALL_STEPS: string[] = [
  "Open `http://your-bot.local/update` on the same WiFi.",
  "Choose {ota} and tap **Upload**. Not a `-factory.bin`.",
  "Wait for it to restart, about a minute.",
];

export const USB_STEPS: string[] = [
  "**Put the board in download mode.** CoreS3 and Stackchan: hold the bottom button about 2 seconds until the green light comes on. Waveshare boards: hold **BOOT** while you plug in the USB cable.",
  "In Chrome or Edge, open [Espressif's web flasher](https://espressif.github.io/esptool-js/). Connect, set the flash address to `0x0`, choose the `-factory.bin` for your board and tap **Program**.",
  "Unplug it and plug it back in. It starts the `vizBot-XXXX` hotspot; carry on with [Get it online](/vizbot/guide#setup).",
];
