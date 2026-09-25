// Every vizBot fact the five pages share: boards, gestures, dock tiles,
// settings, the web panel's cards, the guide's steps and fixes. Keep it in step
// with the firmware (github kpow/vizpow, vizbot/): BOARD_TYPE tokens in config.h, the touch UI in
// touch_ui.h, the web panel in web_server.h, the OTA filename check in ota_update.h.
//
// Rich strings use a tiny inline markup rendered by <Rich> in
// components/vizbot/bits.tsx: **bold**, `code`, [text](href).

export type BoardId = "lcd169" | "lcd13" | "cores3" | "stackchan";

/** The firmware version these pages describe. The live latest version comes from /api/vizbot/releases. */
export const DOC_VERSION = "3.4.1";

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
    hint: "Small portrait touch screen. Mine lives in a lime-green dino case.",
    feats: ["Touch", "Portrait 240×280", "Motion sensor"],
    touch: true,
    notes: [
      "Everything in the guide applies. Sheets come up from the bottom.",
      "Shake it and it gets dizzy.",
    ],
  },
  {
    id: "lcd13",
    name: "Waveshare ESP32-S3-LCD-1.3",
    short: "Waveshare 1.3″",
    sub: "ESP32-S3-LCD-1.3",
    token: "esp32s3-lcd13",
    hint: "Square 240×240 screen, no touch. Fits a 20 mm beamsplitter cube, which makes it the hologram one.",
    feats: ["No touch", "Square 240×240", "Hologram", "Battery"],
    touch: false,
    notes: [
      "No touch, so you drive it from the [web panel](/vizbot/web).",
      "It fits a 20 mm beamsplitter cube. Turn on **Hologram Mode** in the [web panel](/vizbot/web#wled) (WLED Display card) to flip the screen, and the face floats in the cube. Silly trick, looks great.",
      "Shake it for a reaction. Shake for half a second to flip to weather. Do it again to flip back.",
      "Runs on a battery and charges over USB-C.",
    ],
  },
  {
    id: "cores3",
    name: "M5Stack CoreS3",
    short: "M5Stack CoreS3",
    sub: "M5Stack CoreS3",
    token: "m5cores3",
    hint: "The M5Stack cube with a 2″ landscape touch screen.",
    feats: ["Touch", "Landscape 320×240", "Speaker + mics"],
    touch: true,
    notes: [
      "Landscape, so the dock is two side rails and settings get a category list on the left.",
      "Has a speaker and mics. Turn on **Audio FX** in Settings › Light & sound and the scenes react to music. **Reactivity** sets how much.",
    ],
  },
  {
    id: "stackchan",
    name: "Stackchan (CoreS3 + robot base)",
    short: "Stackchan",
    sub: "CoreS3 + robot base",
    token: "stackchan",
    hint: "A CoreS3 on the robot base. The head moves.",
    feats: ["Moving head", "12-LED ring", "Head touch", "Battery"],
    touch: true,
    notes: [
      "The head drifts around on its own and reacts when you touch the top of it.",
      "**Head** in the dock: nod, shake, look up, look down, center, Chill mode.",
      "Base LEDs and LED mode are in Settings › Light & sound. Battery is in System.",
      "Use the `stackchan` file, not `m5cores3`. It's a CoreS3 inside, but the firmware is different.",
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
    body: "25 expressions and three personalities: Chill, Hyper and Grumpy. Left alone it looks around, blinks and mutters in speech bubbles. Poke it and it reacts.",
    caption: "mood sheet · 1.69",
  },
  {
    screen: "s3scene",
    frame: "landscape",
    title: "Light shows behind the eyes",
    body: "16 animated scenes behind the face, with 15 palettes and a kaleidoscope. Swipe sideways to change it or let it cycle. On a CoreS3 they react to music.",
    caption: "scene switcher · CoreS3",
  },
  {
    screen: "dock",
    frame: "dino",
    title: "Clock and weather",
    body: "On WiFi it keeps time and shows local weather with a 3-day forecast. Both are one swipe away in the dock.",
    caption: "quick dock · 1.69",
  },
  {
    screen: "connect",
    frame: "dino",
    title: "Friends and LEDs",
    body: "It can push its speech bubbles and weather to a WLED matrix. It finds other vizBots nearby over ESP-NOW, so two of them don't fight over the same matrix.",
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

export interface TocItem {
  id: string;
  name: string;
  /** Only these boards. Hidden when the page's board filter excludes them. */
  boards?: BoardId[];
}

/** The guide. Touch and web panel are pointer cards to their own pages. */
export const TOC: TocItem[] = [
  { id: "setup", name: "get it online" },
  { id: "touch", name: "the touch screen" },
  { id: "web", name: "the web panel" },
  { id: "update", name: "updating firmware" },
  { id: "boards", name: "board notes" },
  { id: "help", name: "if something's off" },
];

/** /vizbot/touch */
export const TOUCH_TOC: TocItem[] = [
  { id: "gestures", name: "gestures" },
  { id: "dock", name: "the quick dock" },
  { id: "sheets", name: "scene, mood, light" },
  { id: "settings", name: "settings" },
  { id: "landscape", name: "CoreS3 and Stackchan", boards: ["cores3", "stackchan"] },
];

export const SETUP_STEPS: string[] = [
  "**Plug it in.** It runs a self-check and shows its face. With no WiFi saved it starts its own hotspot, `vizBot-XXXX`. The four characters are unique to your bot.",
  "On your phone, join `vizBot-XXXX`. Password `12345678`. The setup page should pop up. If it doesn't, go to `192.168.4.1`.",
  "Tap **Scan Networks**, pick your WiFi, enter the password, tap **Connect**.",
  "Put your phone back on your home WiFi. The bot's hotspot stays on so it can talk to other bots. Ignore it.",
  "Open `http://vizbot-xxxx.local` (same four characters). That's the [web panel](/vizbot/web). Bookmark it.",
];

export const GESTURES: { icon: GestureIcon; k: string; v: string }[] = [
  { icon: "tap", k: "Tap the face", v: "Poke it." },
  { icon: "up", k: "Swipe up or long-press", v: "Open the dock." },
  { icon: "side", k: "Swipe left or right", v: "Previous or next scene." },
  { icon: "down", k: "Swipe down", v: "Close. Tapping the face works too." },
  { icon: "wait", k: "Leave it", v: "Sheets close after 10 seconds. Settings pages after 30." },
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
    body: "Arrows step through 16 scenes plus plain black. Set the palette, Pixel or Hi-res, and Auto. Picking a scene by hand turns Auto off so it sticks.",
  },
  { screen: "mood", name: "Mood", body: "Pick Chill, Hyper or Grumpy. Tap any of the 25 faces to wear it." },
  {
    screen: "light",
    name: "Light",
    body: "Drag the slider or tap − and +. Night, Day and Max are presets.",
  },
];

export const SETTINGS: { name: string; cat: Cat; desc: string }[] = [
  { name: "Look", cat: "look", desc: "Scene, palette, hi-res, kaleidoscope, face color, auto-cycle" },
  { name: "Mood", cat: "mood", desc: "Personality, rotation, expression" },
  { name: "Info", cat: "info", desc: "Weather, clock, time zone" },
  { name: "Light", cat: "light", desc: "Screen brightness. Volume and Audio FX on CoreS3. Base LEDs on Stackchan" },
  { name: "Connect", cat: "connect", desc: "Network, .local address, IP, signal, nearby bots. Hotspot steps when offline" },
  { name: "System", cat: "system", desc: "Version, name, uptime, memory, battery. Hold 1.5 s to Restart or Power off" },
];

export const LANDSCAPE_SHOTS: { screen: ScreenKey; caption: string; boards: BoardId[] }[] = [
  { screen: "s3dock", caption: "dock: two side rails", boards: ["cores3", "stackchan"] },
  { screen: "s3scene", caption: "scene", boards: ["cores3", "stackchan"] },
  { screen: "s3mood", caption: "mood", boards: ["cores3", "stackchan"] },
  { screen: "s3sound", caption: "settings › light & sound", boards: ["cores3", "stackchan"] },
  { screen: "s3head", caption: "settings › head (stackchan)", boards: ["stackchan"] },
];

/** Update steps; `{ota}` becomes the example OTA file name. */
export const UPDATE_STEPS: string[] = [
  "Grab your board's file from [Downloads](/vizbot/releases). It looks like {ota}: board name in the middle, **no** `-factory` on the end.",
  "Open `http://vizbot-xxxx.local/update`, or hit **Update** next to Firmware in the web panel.",
  "Choose the `.bin` and tap **Upload**. Leave the page open until it's done.",
  "It restarts on its own. The new version shows in **Settings › System** and in the web panel.",
];

export const FIXES: { title: string; body: string; boards?: BoardId[] }[] = [
  {
    title: "I can't open vizbot-xxxx.local",
    body: "Swipe up. The address is at the top of the dock, and **Settings › Connect** has the IP. Use the IP instead, like `http://192.168.1.42`. Some Android phones and older Windows PCs can't do .local names. The 1.3 shows its address when it boots.",
  },
  {
    title: "It started its own hotspot again",
    body: "It couldn't join your WiFi. Usually a changed password, a 5 GHz-only network, or it's too far from the router. Join `vizBot-XXXX` and set it up again.",
  },
  {
    title: "The update says “Wrong board type”",
    body: "Wrong file for this board. The name has to contain your board's token, like `esp32s3-lcd169`. The update page tells you which one it wants. Stackchan takes `stackchan`, not `m5cores3`.",
  },
  {
    title: "The update stopped partway",
    body: "Nothing changes until the whole file lands, so it keeps the old version. Reload and try again.",
  },
  {
    title: "It's too bright at night",
    body: "Swipe up, **Light**, **Night**. On the 1.3 use Brightness in the web panel.",
  },
  {
    title: "The Stackchan head stopped moving after an update",
    body: "Power it fully off. Hold the bottom button about 6 seconds, or hold **Power off** in Settings › System. Then turn it back on. A plain restart isn't enough for the servos.",
    boards: ["stackchan"],
  },
];

// ------------------------------------------------------------------ web panel
// /vizbot/web. One section per card, in the panel's own order. Facts come from
// the firmware's web_server.h (the page and its handlers) plus the headers the
// handlers call. Screenshots: a Stackchan on 3.4.0, captured at 2x.

const W = "/images/vizbot/web/";

export const WEB_FULL = { src: W + "web-full.jpg", w: 1400, h: 1842 };

export const WEB_OPEN_STEPS: string[] = [
  "On anything on the same WiFi, open `http://vizbot-xxxx.local`. The four characters are unique to your bot. Named it? Use the name, like `http://vizbot-desk.local`.",
  "No luck? Use the IP instead. It's in **Settings › Connect** and on the pill at the top of the dock. The 1.3 shows it when it boots.",
  "Bookmark it. It works the same on a phone or a desktop.",
];

/** What's on the page before the cards. */
export const WEB_LAYOUT: string[] = [
  "**The yellow bar** shows the firmware version and the bot's name. Two dots on the right: **Connected** and **WLED**.",
  "**The cards** sit in two columns on a wide screen and stack in one on a phone. This page follows their order.",
  "**Fold a card** by tapping its title. The ▾ turns sideways. Expressions and Say Something don't fold. The panel remembers what you folded, in that browser.",
  "**The bar at the bottom** names the bot you're talking to and its .local address.",
];

export interface WebControl {
  /** The label as the panel shows it */
  k: string;
  v: string;
  boards?: BoardId[];
}

export interface WebSection {
  id: string;
  /** Heading on this page */
  name: string;
  /** The card's title in the panel */
  card: string;
  shot: string;
  /** Screenshot size in pixels (2x) */
  w: number;
  h: number;
  boards?: BoardId[];
  lead: string;
  controls: WebControl[];
  note?: string;
}

const MIC_BOARDS: BoardId[] = ["cores3", "stackchan"];

export const WEB_SECTIONS: WebSection[] = [
  {
    id: "expressions",
    name: "expressions",
    card: "Expressions",
    shot: W + "web-expressions.png",
    w: 1100,
    h: 382,
    lead: "All 25 faces, Neutral to Sassy. Tap one and the bot wears it. The last one you tapped turns yellow.",
    controls: [],
  },
  {
    id: "say",
    name: "say something",
    card: "Say Something",
    shot: W + "web-say.png",
    w: 1100,
    h: 146,
    lead: "Type up to 60 characters and hit **Send**. It shows up in a speech bubble on the bot for about 4 seconds.",
    controls: [],
    note: "With **Forward Speech** on in [WLED display](#wled), the words go to the matrix too, one word at a time.",
  },
  {
    id: "personality",
    name: "personality",
    card: "Personality",
    shot: W + "web-personality.png",
    w: 1100,
    h: 202,
    lead: "Chill, Hyper or Grumpy. The personality also picks which scenes and palettes Auto cycles through.",
    controls: [
      { k: "Personality", v: "Pick one. Picking one by hand stops the rotation." },
      {
        k: "Rotate · every N min",
        v: "Tick it and every N minutes it switches to a random personality from the list. 1 to 60, default 5. Set the minutes first, then tick the box. Untick it to stay on the one showing.",
      },
    ],
  },
  {
    id: "appearance",
    name: "appearance",
    card: "Appearance",
    shot: W + "web-appearance.png",
    w: 1100,
    h: 1132,
    lead: "The face color and everything behind the face. Pick **Ambient** to see the rest of the card.",
    controls: [
      { k: "Face Color", v: "White, Cyan, Green, Pink or Yellow." },
      {
        k: "Background",
        v: "**Black** is a plain black screen behind the face. **Ambient** runs a scene back there and opens the controls below.",
      },
      {
        k: "Ambient Effect",
        v: "16 scenes, Plasma to Hiphotic. Tap one and it stays: picking a scene turns Auto off.",
      },
      {
        k: "Stop Auto / Auto",
        v: "Auto moves to a new scene every 20 seconds and a new palette every 5. The button reads **Stop Auto** while it cycles and **Auto** when it's stopped.",
      },
      {
        k: "Audio FX",
        v: "The scenes react to the mic. The row only shows on boards with a mic.",
        boards: MIC_BOARDS,
      },
      {
        k: "Reactivity",
        v: "How hard they react. 0 to 200, default 100. 0 is off and 200 doubles it. The marks under it read Off, Tasteful, Dramatic.",
        boards: MIC_BOARDS,
      },
      {
        k: "Kaleidoscope",
        v: "Folds the scene into a mirror pattern. Six stops: Off, Vertical, Horizontal, H+V, 6-Slice, 8-Slice.",
      },
      {
        k: "Spin",
        v: "Turns the pattern on 6-Slice and 8-Slice. 128 is about one turn every 5 seconds. 0 holds it still. The mirror modes ignore it.",
      },
      { k: "Blend", v: "Mixes the pattern with the plain scene. 255 is all kaleidoscope. 0 is the plain scene." },
      { k: "Slice Offset", v: "Pans the mirror modes. On 6-Slice and 8-Slice it turns the wedge instead." },
    ],
  },
  {
    id: "sprites",
    name: "WLED sprites",
    card: "WLED Sprites",
    shot: W + "web-sprites.png",
    w: 1100,
    h: 632,
    lead: "A slideshow of 8×8 sprites on a 32×8 WLED matrix, three at a time. Set up the matrix in [WLED display](#wled) first.",
    controls: [
      {
        k: "Sprite grid",
        v: "28 sprites: Heart, Skull, Pacman, Invader, Dragon and the rest. Tap one to add it to the queue. It turns yellow.",
      },
      { k: "Queue", v: "The yellow tags under the grid, in play order. Tap one to take it out." },
      { k: "Start / Stop", v: "Plays the queue on the matrix and fades between groups of three. An empty queue won't start." },
      { k: "Clear", v: "Empties the queue and stops the show." },
      { k: "Cycle Time", v: "How long each group stays up. 1 to 10 seconds, default 4." },
    ],
    note: "When the show stops, the matrix goes back to whatever WLED was playing before.",
  },
  {
    id: "device",
    name: "device",
    card: "Device",
    shot: W + "web-device.png",
    w: 1070,
    h: 722,
    lead: "Brightness, the clock and the firmware.",
    controls: [
      { k: "Brightness", v: "Screen brightness, 1 to 255. Default 15." },
      { k: "Volume", v: "Speaker volume, 0 to 255. The Waveshare boards have no speaker.", boards: MIC_BOARDS },
      { k: "Time Overlay", v: "Puts the clock on the face. Same as **Clock** in the dock." },
      {
        k: "Time Zone",
        v: "Ten presets: the four US zones, Arizona, Alaska, Hawaii, UTC, UK and Central Europe. Daylight saving is built in. Default Eastern.",
      },
      {
        k: "Hi-Res Background",
        v: "Draws the scene at the screen's full resolution. Off, it's chunky pixels. Same as Pixel / Hi-res in the Scene sheet.",
      },
      {
        k: "Firmware · Update",
        v: "The version it's running. **Update** opens the update page at `/update`. The steps are in [updating firmware](/vizbot/guide#update).",
      },
    ],
  },
  {
    id: "sounds",
    name: "sounds",
    card: "Sounds",
    shot: W + "web-sounds.png",
    w: 1070,
    h: 1108,
    boards: MIC_BOARDS,
    lead: "Every sound the bot makes, on buttons. The card only fills in on a CoreS3 or Stackchan.",
    controls: [
      {
        k: "MIDI Synth",
        v: "Where sound goes. **MIDI Active**: a SAM2695 MIDI synth unit on a Grove port plays it. **Speaker**: the built-in speaker. **Off**: no sound.",
      },
      {
        k: "Synth Port",
        v: "Which Grove port the synth is on: **Port C** (default) or **Port A**. It switches live, no restart. Port A is the I2C port too, so the synth and an I2C unit can't share it.",
      },
      {
        k: "Sound buttons",
        v: "37 of them: Boot Chime, Tap Boop, Level Up, Funky Bot, Retro Quest and the rest. These are the sounds it plays on its own. Tap one to hear it.",
      },
    ],
  },
  {
    id: "weather",
    name: "weather & info",
    card: "Weather & Info",
    shot: W + "web-weather.png",
    w: 1070,
    h: 544,
    lead: "Weather on the bot's screen, and a timed weather and sprite show for the WLED matrix.",
    controls: [
      {
        k: "Show Weather",
        v: "Swaps the face for the weather view: now plus 3 days. Toggle it off to get the face back.",
      },
      {
        k: "Location",
        v: "Type a zip code or a city and hit **Set**. It looks it up on Open-Meteo and saves the spot. **Location not found** means the lookup came back empty.",
      },
      {
        k: "Scheduled Content",
        v: "Every N minutes it takes over the WLED matrix: 2 minutes of weather, then 4 minutes of 20 random sprites. Speech pauses it. The first run starts about a minute after you turn it on.",
      },
      { k: "Cycle every · min", v: "Minutes between runs. 1 to 120, default 30." },
      {
        k: "Status line",
        v: "Only one bot per matrix runs the show. That one reads **Owner** and the current phase. The others read **Deferred to another bot**.",
      },
    ],
  },
  {
    id: "wifi",
    name: "WiFi",
    card: "WiFi",
    shot: W + "web-wifi.png",
    w: 1070,
    h: 528,
    lead: "The bot's name and the network it's on.",
    controls: [
      {
        k: "Device Name",
        v: "Becomes the address and the hotspot name, as typed. Enter `vizbot-desk`, hit **Set**, restart the bot, and it's at `vizbot-desk.local`. Spaces turn into hyphens. Up to 23 characters.",
      },
      { k: "Connected to", v: "The network it's on and its IP." },
      {
        k: "Scan Networks",
        v: "Lists the networks it can hear, with signal bars. Open ones say OPEN. Tap one, type the password, hit **Connect**. The new IP shows once it's on.",
      },
      {
        k: "Forget Network",
        v: "Clears the saved WiFi. The bot goes back to its own hotspot, like a new one. Start over at [get it online](/vizbot/guide#setup).",
      },
    ],
  },
  {
    id: "wled",
    name: "WLED display",
    card: "WLED Display",
    shot: W + "web-wled.png",
    w: 1070,
    h: 604,
    lead: "Point the bot at a WLED matrix and it sends its speech there. It's built for a 32×8 matrix.",
    controls: [
      {
        k: "Status line",
        v: "Shows once there's an IP and Forward Speech is on. **Reachable** in green or **Unreachable** in red. The WLED dot in the header matches. Grey means it's off.",
      },
      {
        k: "Forward Speech",
        v: "Every speech bubble goes to the matrix too. Off, speech stays on the bot and Test Connection sends nothing.",
      },
      {
        k: "Hologram Mode",
        v: "Flips the bot's own screen top to bottom. It lives in this card but doesn't touch the matrix. It's for a beamsplitter cube: the reflection comes out the right way up and the face floats in the glass. Silly trick, looks great.",
      },
      { k: "Flip Text (H)", v: "For a matrix wired the other way. Text on the matrix reads backwards? Turn this on." },
      { k: "WLED IP · Set", v: "The matrix's IP address. Type it and hit **Set**." },
      { k: "Test Connection", v: "Sends **Hello** to the matrix for 5 seconds." },
    ],
    note: "When a message ends, WLED goes back to whatever it was playing. Two bots on one matrix find each other over ESP-NOW and take turns.",
  },
  {
    id: "stackchan",
    name: "Stackchan",
    card: "StackChan",
    shot: W + "web-stackchan.png",
    w: 1070,
    h: 1364,
    boards: ["stackchan"],
    lead: "Head, base LEDs, chill and power. The card only shows up on a Stackchan.",
    controls: [
      {
        k: "Head Control",
        v: "**Left** and **Right** turn the head. **Up** and **Down** tilt it. **Center** brings it home. **Nod** and **Shake** are the moves it makes when you tap the top of its head.",
      },
      { k: "Yaw", v: "Turn, −90° to 90°. The head moves when you let go of the slider." },
      { k: "Pitch", v: "Tilt, 25° to 85°. The 25° floor keeps the head off the base." },
      {
        k: "Base LEDs",
        v: "The 12-LED ring. Ten modes: Off, Breathing, Rainbow, Chase, Fire, Twinkle, Pulse, Aurora, Mood and Audio. **Mood** takes its color from the face's expression. **Audio** reacts to the mic.",
      },
      { k: "Brightness · Speed", v: "For the ring. 10 to 255 each, defaults 80 and 128." },
      {
        k: "Chill Mode (10 min)",
        v: "The head goes home and stops moving for 10 minutes. The face goes Chill, it says Zzz and the ring breathes slowly. Tap it again to wake it up. Holding the top of its head for 2 seconds does the same.",
      },
      { k: "Battery", v: "Battery voltage and current draw." },
      {
        k: "Power Off",
        v: "Asks first. Then it turns off the servos, the ring and the screen and shuts down. It's the full power-off a stuck head needs after an update.",
      },
    ],
  },
];

// ------------------------------------------------------------------ releases

export const INSTALL_STEPS: string[] = [
  "On the same WiFi, open `http://your-bot.local/update`.",
  "Choose {ota} and tap **Upload**. Not the `-factory.bin`.",
  "It restarts in about a minute.",
];

export const USB_STEPS: string[] = [
  "**Download mode.** CoreS3 and Stackchan: hold the bottom button about 2 seconds until the green light comes on. Waveshare: hold **BOOT** while you plug in USB.",
  "In Chrome or Edge, open [Espressif's web flasher](https://espressif.github.io/esptool-js/). Connect, set the address to `0x0`, pick your board's `-factory.bin`, hit **Program**.",
  "Unplug it and plug it back in. It starts the `vizBot-XXXX` hotspot. Carry on from [Get it online](/vizbot/guide#setup).",
];
