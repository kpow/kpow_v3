// Every vizMac fact the three pages share: the modes, the buttons, the menu bar
// app, the web UI, each controller mode, Wi-Fi setup, updates and the fixes.
// Keep it in step with the vizMac repo (private, kpow/vizMac): README.md, the docs/
// plans and specs, the Mac app in vizmac/ (menubar.py, web/index.html, media.py)
// and the controller firmware in firmware/controller/src/ (app*.cpp, input.h).
// Checked against controller firmware 9ce756f (Sep 27, 2026).
//
// No secrets on these pages: no Wi-Fi names, pairing codes, IP or MAC addresses.
// Examples use obvious placeholders (ABC234, vizMac-XXXX).
//
// Rich strings use the inline markup <Rich> renders (components/vizbot/bits.tsx):
// **bold**, `code`, [text](href).

import type { TocItem } from "@/content/vizbot";

/** The controller firmware these pages describe (vizmac/firmware/controller.json). */
export const FW_LABEL = "Sep 27";

export const BUILDLOG_URL = "/builds/vizmac";

export type ModeId = "keys" | "np" | "clock" | "wled";

/** Mode hues from the firmware (ui_gfx.h). */
export const HUE: Record<ModeId, string> = {
  keys: "#FF9A3C",
  np: "#B18CFF",
  clock: "#5EEAD4",
  wled: "#FFD166",
};

// ------------------------------------------------------------------ images
// Screens: 2x controller mocks (480×640) and their 16×8 LED strips (480×248),
// rendered with placeholder names and addresses. Photos: the build log, resized.

const S = "/images/vizmac/screens/";
const M = "/images/vizmac/media/";

export const shot = (id: string) => `${S}${id}.png`;

export const PHOTOS = {
  hero: {
    src: M + "desk-now-playing.jpg",
    w: 1400,
    h: 1050,
    alt: "A ROCCAT Vulcan Pro TKL lit key by key, with the vizMac controller beside it showing Now Playing and a rainbow EQ on its LEDs",
  },
  keyboard: {
    src: M + "keyboard-vortex.jpg",
    w: 960,
    h: 540,
    alt: "The Vulcan Pro TKL running a Noodle effect, every key a different color",
  },
  keys: { src: M + "mode-keys.jpg", w: 960, h: 720, alt: "Keys mode: the Distrt effect on screen, the keyboard's colors on the LEDs" },
  np: { src: M + "now-playing-eq.jpg", w: 960, h: 720, alt: "Now Playing: album art, title and progress, with a rainbow EQ on the LEDs" },
  npPaused: { src: M + "now-playing-paused.jpg", w: 960, h: 720, alt: "The controller paused on a song from Music" },
  clock: { src: M + "clock-face.jpg", w: 960, h: 720, alt: "Clock: the analog Instrument face, with the time as digits on the LEDs" },
  wled: { src: M + "wled-list.jpg", w: 960, h: 720, alt: "WLED: a list of lights with their brightness, and one bar per light on the LEDs" },
} as const;

export type PhotoKey = keyof typeof PHOTOS;

export const MENUBAR_SHOT = {
  src: S + "menubar.png",
  w: 648,
  h: 946,
  alt: "The vizMac skull menu: keyboard status, effect groups, palette, brightness, reactions, start at login, Wi-Fi access and pairing code, web UI and quit",
};

// ------------------------------------------------------------------ landing

export interface Mode {
  id: ModeId;
  name: string;
  photo: PhotoKey;
  photoSub: string;
  screen: string;
  leds: string;
  caption: string;
  body: string;
}

export const MODES: Mode[] = [
  {
    id: "keys",
    name: "Keys",
    photo: "keys",
    photoSub: "the keyboard's effect, live on the LEDs",
    screen: "m-keys-main",
    leds: "m-keys-main-leds",
    caption: "keys · noodle plasma",
    body: "The keyboard's effect. Turn to change it. The menu has every effect, its settings, the palettes and the keyboard. The LEDs show the keyboard, live.",
  },
  {
    id: "np",
    name: "Now Playing",
    photo: "np",
    photoSub: "Spotify or Music, with an EQ on top",
    screen: "m-np-main",
    leds: "np-eq-leds",
    caption: "now playing · rainbow eq",
    body: "Spotify or Music: the art, the song, how far in. Turn to skip, KO to pause. The LEDs are an EQ of the Mac's audio, in a palette you pick.",
  },
  {
    id: "clock",
    name: "Clock",
    photo: "clock",
    photoSub: "analog face and a focus timer",
    screen: "f-instrument-run",
    leds: "f-instrument-run-leds",
    caption: "clock · focus timer running",
    body: "An analog \"Instrument\" face, with the time as digits on the LEDs. Set a focus timer with the knob. When it ends, the LEDs flash and so does the keyboard.",
  },
  {
    id: "wled",
    name: "WLED",
    photo: "wled",
    photoSub: "13 lights, one knob",
    screen: "m-wled-list",
    leds: "m-wled-list-leds",
    caption: "wled · the light list",
    body: "Your WLED lights, the ones you pick in the web UI. On, off, brightness, presets and effects. It talks to the lights directly, so it works with the Mac asleep.",
  },
];

export interface Part {
  eyebrow: string;
  title: string;
  bullets: { k: string; v: string }[];
}

export const APP_PART: Part = {
  eyebrow: "part 1",
  title: "The menu bar app",
  bullets: [
    { k: "Keyboard", v: "drives the Vulcan Pro TKL over USB, every key, 30 times a second." },
    { k: "Effects", v: "25 of them (keys, audio, ambient, Noodle 2K) and 23 palettes." },
    { k: "Talks to", v: "Spotify, Music, the Mac's audio and your WLED lights." },
    { k: "Controller hub", v: "pairing, effect sync, the clock and its firmware updates." },
    { k: "Menu bar + web UI", v: "a skull for quick switches, a web UI for the rest." },
  ],
};

export const CONTROLLER_PART: Part = {
  eyebrow: "part 2",
  title: "The controller",
  bullets: [
    { k: "Hardware", v: "an ESP32-S3 with a 2.4\" screen, a knob, a KO button and a 16 × 8 LED matrix, in a printed case." },
    { k: "Four modes", v: "Keys, Now Playing, Clock with a focus timer, and WLED. They keep running; turn at the top to flip between them." },
    { k: "Buttons", v: "push the knob to go back, KO to choose. Hold KO for the mode's shortcut, hold the knob to sleep." },
    { k: "LEDs that change with the mode", v: "the keyboard's effect, a palette EQ of the music, the time, your lights' colours." },
    { k: "Renders locally", v: "draws the keyboard's effects itself at 40 fps, so nothing stutters over Wi-Fi." },
    { k: "WLED direct", v: "talks to your lights itself, so they still work while the Mac sleeps." },
    { k: "Setup and updates", v: "Wi-Fi from your phone by QR code, updates from the web UI, and it sleeps when the Mac does." },
  ],
};

export type Glyph = "turn" | "push" | "ko" | "sleep";

/** The buttons. `short` is the landing band, `long` the controller page. */
export const CONTROLS: { glyph: Glyph; k: string; short?: string; long: string }[] = [
  { glyph: "turn", k: "Turn", short: "move, change, skip", long: "Move, change, skip." },
  { glyph: "push", k: "Push the knob", short: "back. Mash it to reach the modes.", long: "Back, up one level. Mash it to reach the modes." },
  { glyph: "sleep", k: "Hold the knob 2 s", short: "sleep", long: "Sleep." },
  { glyph: "ko", k: "KO", short: "choose. Hold it for the page's shortcut.", long: "Choose: open, confirm, toggle." },
  { glyph: "ko", k: "Hold KO", long: "The page's shortcut. See the table below." },
];

export const HIGHLIGHTS: { icon: "keyboard" | "sparkles" | "timer" | "moon" | "qr" | "download"; title: string; body: string; chips: string[] }[] = [
  {
    icon: "keyboard",
    title: "Reacts to keys and audio",
    body: "Reactive, ripple and heatmap follow your typing. Spectrum and pulse follow whatever the Mac plays.",
    chips: ["Keys", "Audio"],
  },
  {
    icon: "sparkles",
    title: "Noodle 2K effects",
    body: "17 effects from the Noodle LED project, compiled unchanged, with its 23 palettes.",
    chips: ["17 effects", "23 palettes"],
  },
  { icon: "timer", title: "A focus timer", body: "1 to 120 minutes on the knob. When it ends, the keyboard flashes green.", chips: ["Clock"] },
  {
    icon: "moon",
    title: "Sleeps with the Mac",
    body: "Screen off, locked or screen saver: the controller goes dark too. It wakes when the Mac does.",
    chips: ["Controller"],
  },
  {
    icon: "qr",
    title: "Wi-Fi setup from your phone",
    body: "Scan the QR code on its screen, pick your Wi-Fi on the phone. No passwords baked into the firmware.",
    chips: ["Controller"],
  },
  {
    icon: "download",
    title: "Updates from the web UI",
    body: "vizMac carries the controller's firmware. One click, about a minute, over Wi-Fi.",
    chips: ["Web UI", "Controller"],
  },
];

// ------------------------------------------------------------------ guide (/vizmac/guide)

export const GUIDE_TOC: TocItem[] = [
  { id: "menubar", name: "the menu bar app" },
  { id: "web", name: "the web UI" },
  { id: "controller", name: "the controller" },
  { id: "help", name: "if something's off" },
];

export interface Row {
  k: string;
  v: string;
}

export const MENU_GROUPS: { label: string; rows: Row[] }[] = [
  {
    label: "effects",
    rows: [
      { k: "First line", v: "Keyboard connected, or what it's waiting for. A **?** next to the skull means no keyboard yet." },
      { k: "Keys, Audio, Ambient, Noodle", v: "Pick an effect. The one playing has a tick." },
      { k: "Palette (Noodle effects)", v: "23 palettes. Only for Noodle effects." },
      { k: "Brightness", v: "25, 50, 75 or 100%. Finer steps in the web UI." },
    ],
  },
  {
    label: "behaviour",
    rows: [
      { k: "React to keypresses", v: "Effects get your keypresses. The Keys effects need it." },
      { k: "React to Mac audio", v: "Effects get the Mac's audio. The Audio effects need it, and most Noodle effects use it." },
      { k: "Start at login", v: "Opens vizMac when you log in." },
    ],
  },
  {
    label: "wi-fi",
    rows: [
      { k: "Allow controller on Wi-Fi", v: "Lets the controller and your phone in. Off by default." },
      { k: "Pairing code", v: "Click to copy it. The Wi-Fi address sits next to it." },
      { k: "New pairing code", v: "Makes a new one. Anything paired needs the new code." },
    ],
  },
  {
    label: "app",
    rows: [
      { k: "Open Web UI…", v: "Opens the web UI in your browser." },
      { k: "Quit (restore onboard lighting)", v: "The keyboard goes back to its own lighting." },
    ],
  },
];

export const WEB_EFFECTS: string[] = [
  "**Left:** every effect, in four groups. Click one to play it.",
  "**Top:** a live copy of the keyboard.",
  "**The effect's card:** its settings as sliders. **Reset to defaults** puts them back.",
  "**Noodle effects** get a palette grid. 23 palettes. Click to switch.",
];

export const EFFECT_GROUPS: Row[] = [
  { k: "Keys", v: "reactive (flash and fade), ripple (rings from each key), heatmap (keys warm up as you type)" },
  { k: "Audio", v: "spectrum (16-band EQ, bass on the left), pulse (breathes with the bass, new color per beat)" },
  { k: "Ambient", v: "rainbow, noise, solid" },
  { k: "Noodle", v: "17 effects from Noodle 2K, like plasma, soap and vortex. Each has a palette." },
];

export const WEB_KEYBOARD: string[] = [
  "**Brightness**, 1 to 100%. For every effect.",
  "**React to keypresses** and **React to Mac audio**, as in the menu.",
  "**The meter** shows bass, mid, treble and beat while audio is on.",
  "**Send LED preview to** {maconly} streams a small live copy of the keyboard to a WLED device. Type its name or address and a size. 16 × 8 is the default.",
];

export const PAIRING_STEPS: string[] = [
  "On the Mac, tick **Allow controller / phone on Wi-Fi** in the Keyboard card. Or use the skull menu.",
  "Note the 6-character pairing code, like `ABC234`. Letters and the digits 2 to 9. Never 0, O, 1 or I.",
  "On a phone, open the address shown next to the code. Type the code once. The browser remembers it.",
];

export const WEB_CONTROLLER: string[] = [
  "The controller firmware that comes with this copy of vizMac, and its date.",
  "Each controller that's online, and the firmware it runs.",
  "**Update to …** when vizMac has newer firmware. See [updates](/vizmac/controller#update).",
  "\"No controller online\": it shows up a few seconds after it connects.",
];

export const WEB_LIGHTS: Row[] = [
  { k: "Each row", v: "Its color, name, address and LED count. Then its brightness, Off, or Offline." },
  { k: "Show", v: "Tick the lights the controller should list." },
  { k: "▲ ▼", v: "Move a light up or down the list." },
  { k: "Open", v: "The light's own WLED page, for presets, segments and settings." },
];

export const FIXES: { title: string; body: string }[] = [
  {
    title: "The skull has a ? next to it",
    body: "No keyboard yet. Plug it in. The first line of the skull menu says what vizMac is waiting for. It reconnects by itself after unplugging or sleep.",
  },
  {
    title: "It says there's a permission problem",
    body: "Input Monitoring is off for vizMac. System Settings › Privacy & Security › Input Monitoring › vizMac. After a rebuild, macOS may ask again.",
  },
  {
    title: "Audio effects don't move",
    body: "Turn on **React to Mac audio**. Allow System Audio Recording for vizMac. Check it with `.venv/bin/vizmac audio-test`.",
  },
  {
    title: "Now Playing says Spotify is closed",
    body: "Open Spotify or Music. If one is open, check Privacy & Security › Automation › vizMac. Browser tabs never show up.",
  },
  {
    title: "The controller says Finding vizMac",
    body: "Is vizMac running, with **Allow controller on Wi-Fi** on? Is the controller on the same Wi-Fi as the Mac? KO searches again.",
  },
  {
    title: "The controller says Code rejected",
    body: "The pairing code changed. Enter the one from the skull menu: turn for each letter, KO for the next, KO on the last to send.",
  },
  { title: "It's stuck on Joining Wi-Fi", body: "KO opens [Wi-Fi setup](/vizmac/controller#wifi). Use a 2.4 GHz network." },
  {
    title: "The LEDs are upside down or swapped",
    body: "Keys › Menu › Status › LED panels. Turn each panel until the test pattern is the right way up.",
  },
  {
    title: "The keyboard kept vizMac's colors after a crash",
    body: "Run `.venv/bin/vizmac restore`. Its own lighting comes back.",
  },
  {
    title: "It says another vizMac process is already controlling the keyboard",
    body: "Only one copy can drive it. The message names the other process (its pid). Stop that one first.",
  },
];

// ------------------------------------------------------------------ controller (/vizmac/controller)

export const CONTROLLER_TOC: TocItem[] = [
  { id: "buttons", name: "buttons" },
  { id: "modes", name: "the mode picker" },
  { id: "kbleds", name: "Keyboard LEDs" },
  { id: "sleep", name: "sleep" },
  { id: "keys", name: "Keys" },
  { id: "np", name: "Now Playing" },
  { id: "clock", name: "Clock and focus timer" },
  { id: "wled", name: "WLED" },
  { id: "wifi", name: "Wi-Fi setup" },
  { id: "update", name: "updates" },
];

export const SHORTCUTS: Row[] = [
  { k: "Keys, main page", v: "Tune: this effect's settings." },
  { k: "Now Playing", v: "Restart the song, and the EQ palette." },
  { k: "Clock, timer running or paused", v: "Stop the timer." },
  { k: "WLED list, on a light", v: "That light on or off." },
  { k: "Anywhere else", v: "Nothing." },
];

export const MODE_PICKER: string[] = [
  "Push the knob until you're there. Four cards: Keys, Now Playing, Clock, WLED.",
  "Turn to flip. The LEDs flip with it.",
  "KO opens the mode, on the page you left.",
  "Each card is live: the effect, the song, the time and timer, how many lights are on.",
  "Left alone 30 s, it opens the card you're on. Inside a mode, 30 s idle goes back to its main page.",
];

export const PICKER_SHOTS: { id: string; caption: string; alt: string }[] = [
  { id: "m-top-keys", caption: "keys", alt: "Mode picker: Keys card" },
  { id: "m-top-np", caption: "now playing", alt: "Mode picker: Now Playing card" },
  { id: "f-top-card", caption: "clock", alt: "Mode picker: Clock card with a mini face" },
  { id: "m-top-wled", caption: "wled", alt: "Mode picker: WLED card" },
];

export const KBLED_STEPS: string[] = [
  "In Keys, KO for the Menu, then open **Keyboard**.",
  "Turn down to **Keyboard LEDs**.",
  "KO switches it: **Each mode's own** or **In every mode**. Saved on the controller.",
];

export const SLEEP: string[] = [
  "**Hold the knob 2 s.** Screen and LEDs go dark. The push goes back one level first.",
  "**Wake it:** any turn or press. That first input only wakes it.",
  "**With the Mac:** it sleeps when the Mac's screens sleep, lock or start the screen saver. It wakes with the Mac.",
  "Woke it by hand while the Mac sleeps? It stays awake until the Mac changes again.",
  "It also wakes for a firmware update, or when the focus timer ends.",
];

export type GlyphRow = { glyph: Glyph; k: string; v: string };

export const KEYS_CONTROLS: GlyphRow[] = [
  { glyph: "turn", k: "Turn", v: "Next or previous effect. It switches when the knob rests." },
  { glyph: "ko", k: "KO", v: "The Menu." },
  { glyph: "ko", k: "Hold KO", v: "Tune, the effect's settings." },
  { glyph: "push", k: "Push", v: "Back to the modes." },
];

export const KEYS_MENU: Row[] = [
  { k: "Effects", v: "All 25. Turn to browse, KO plays one." },
  {
    k: "Tune",
    v: "The effect's settings. KO edits a row, turn changes it, KO is done, push undoes. The palette row opens Palette.",
  },
  { k: "Tune › Palette", v: "Turn to try each one live. KO chooses. Push goes back to the old one." },
  { k: "Keyboard", v: "Brightness, React to keys, React to audio, and [Keyboard LEDs](#kbleds)." },
  {
    k: "Status",
    v: "Wi-Fi and signal, the Mac, keyboard, firmware date, audio, the controller's address, LED panels. Turn to the Wi-Fi row or LED panels, KO opens it.",
  },
];

export const NP_CONTROLS: GlyphRow[] = [
  {
    glyph: "turn",
    k: "Turn",
    v: "Right: next song. Left: the song before. Turns add up (\"Next x3\") and go when the knob rests.",
  },
  { glyph: "ko", k: "KO", v: "Play or pause." },
  { glyph: "ko", k: "Hold KO", v: "Restart song, and the EQ palette." },
  { glyph: "push", k: "Push", v: "Back to the modes. While a skip is counting: cancel it." },
];

export const NP_NOTES: string[] = [
  "\"The song before\" really is the one before, even mid-song.",
  "No volume here. The keyboard has its own volume knob.",
  "**The LEDs:** a 16-band EQ of the Mac's audio, bass on the left. Rainbow unless you pick a palette.",
];

export const NP_PALETTE_STEPS: string[] = [
  "Hold KO.",
  "Turn through Rainbow and the 23 palettes. The LEDs preview each one.",
  "KO chooses. Push goes back without changing it. The top row, **Restart song**, starts the song over.",
];

export const NP_SHOTS: { id: string; caption: string; alt: string }[] = [
  { id: "m-np-skip", caption: "turning: next x2", alt: "Skipping: Next x2, skips when the knob rests" },
  { id: "m-np-paused", caption: "paused", alt: "Paused: art dimmed with a pause badge" },
  { id: "m-np-idle", caption: "nothing playing: KO resumes", alt: "Nothing playing: KO resumes the last song" },
];

/** Dot colours are the clock hands'. */
export const CLOCK_FACE: { dot: string; text: string }[] = [
  { dot: "#9B59F6", text: "Hour hand: purple. On the LEDs, the hours are purple too." },
  { dot: "#2EE08A", text: "Minute hand: green. The minutes on the LEDs are green." },
  { dot: "#FF7A59", text: "Second hand: coral. It ticks once a second." },
  { dot: "", text: "The window at 6 shows the day and date. While a timer runs, it shows the countdown." },
  { dot: "", text: "The time comes from the Mac, in its time zone. Until it has it, the window says **Needs Wi-Fi**." },
];

export const TIMER_STEPS: string[] = [
  "**Turn** to set the length. 1-minute steps up to 10, then 5-minute steps. 1 to 120 min. It starts at 25 and remembers your last one.",
  "**KO** starts it. A ring on the dial shows the time left. The bottom row shows when it ends and how many you've done today.",
  "While it runs: **turn** adds or takes a minute. **KO** pauses. KO again resumes.",
  "**Hold KO** to stop it. The length stays for next time.",
];

export const CLOCK_SHOTS: { id: string; caption: string; alt: string }[] = [
  { id: "f-instrument-set", caption: "setting: 30 min", alt: "Setting the length: 30 min" },
  { id: "f-instrument-run", caption: "running", alt: "Running: the time left in the window, a ring on the dial" },
  { id: "f-instrument-paused", caption: "paused", alt: "The timer paused" },
];

export const TIMER_DONE: string[] = [
  "**Focus done** shows over whatever mode you're in, and wakes the screen.",
  "The LEDs flash green for 10 s, then glow dim. The keyboard flashes green too.",
  "**KO or push:** done. The flashing stops.",
  "**Turn right:** +5 min per click. It starts again when the knob rests.",
  "**Today** counts finished timers and minutes. It starts over at midnight.",
];

export const WLED_STEPS: string[] = [
  "On the Mac, open the web UI's [Lights card](/vizmac/guide#lights).",
  "Tick **Show** on the lights you want, and order them with ▲ ▼.",
  "On the controller, open WLED. The list follows your picks.",
];

export const WLED_LIST: Row[] = [
  { k: "All lights", v: "KO turns them all off. All on, if they're all off." },
  { k: "A light", v: "KO opens it. **Hold KO** turns it on or off." },
  { k: "Each row shows", v: "Its brightness, Off, or Offline." },
  { k: "The LEDs", v: "One bar per light, as tall as it is bright." },
];

export const WLED_LIGHT: Row[] = [
  { k: "Brightness", v: "KO, turn to set it, KO when done. Push undoes." },
  { k: "Light", v: "KO switches it on or off. The page opens here." },
  { k: "Preset › and Effect ›", v: "KO opens the list. Turn, then KO applies. You stay on the list to try another." },
  { k: "Push", v: "Back to the list." },
];

export const WIFI_STEPS: string[] = [
  "The screen shows a QR code, with a network name like `vizMac-XXXX` and its password.",
  "Point your phone's camera at it and join. A setup page opens. If it doesn't, go to `192.168.4.1`.",
  "Pick your Wi-Fi and type its password.",
  "Optional: type the pairing code from the skull menu. Leave it blank to keep the one it has.",
  "Tap **Connect**. The screen shows Joining Wi-Fi (up to 15 s), then Connected. KO continues.",
];

export const WIFI_SHOTS: { id: string; caption: string; alt: string }[] = [
  { id: "w-qr", caption: "1 · scan", alt: "Set up Wi-Fi: a QR code, the setup network and its password" },
  { id: "w-phone", caption: "2 · phone joined", alt: "Phone connected: use the page that popped up" },
  { id: "w-join", caption: "5 · joining", alt: "Joining Wi-Fi, up to 15 s" },
  { id: "w-done", caption: "connected", alt: "Connected, continuing in 3 s" },
];

export const WIFI_ERRORS: Row[] = [
  { k: "Wrong password", v: "Type it again. Passwords are case-sensitive." },
  { k: "Network not found", v: "Out of range, or a 5 GHz network." },
  { k: "No IP address", v: "It joined, but the router gave it no address." },
  { k: "Timed out", v: "No answer in 15 s. Try again." },
];

export const WIFI_AGAIN: string[] = [
  "Keys › Menu › **Status**. Turn to the Wi-Fi row, KO.",
  "Or, on the Joining Wi-Fi screen, KO.",
];

export const PAIR_SCREENS: Row[] = [
  { k: "Finding vizMac", v: "Open vizMac and turn on **Allow controller on Wi-Fi**. KO searches again." },
  {
    k: "Code rejected",
    v: "Enter the code from the skull menu. Turn picks a letter, KO goes to the next. KO on the last one sends it.",
  },
  { k: "No keyboard", v: "The Mac has no keyboard plugged in. KO goes on to Keys anyway. Push goes to the modes." },
];

export const UPDATE_STEPS: string[] = [
  "On the Mac, open the web UI and find the **Controller** card.",
  "Click **Update to …** next to your controller. It only shows when vizMac has newer firmware.",
  "Wait. The card shows Sending, then Installing and restarting. The controller shows **Updating**, with a blue bar across its LEDs.",
  "**✓ Updated.** The firmware date is in Keys › Menu › Status.",
];

export const BUILDER_NOTES: string[] = [
  "All from `firmware/controller`, with PlatformIO.",
  "**USB:** `pio run -t upload`",
  "**Over Wi-Fi:** `pio run -e ota -t upload`. About 30 s. It uses the pairing code, which it gets from vizMac.",
  "**Ship it in vizMac:** commit, then `python firmware/controller/tools/bundle.py`, then commit the bundle.",
];
