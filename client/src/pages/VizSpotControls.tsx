import { useCallback, useEffect, useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { SEO } from "@/components/global/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, Image as ImageIcon } from "lucide-react";

// User guide for the board's own control page (http://vizspot.local, served from
// github kpow/vizSpot src/net/web_page.h). Defaults and ranges come from
// src/settings.cpp and the clamps in src/net/web_api.cpp; keep them in step.
//
// Layout: sections fold (Radix accordion, controlled so #hash links and "open all"
// work); inside, self-explanatory rows show a one-liner and fold their full
// explanation (native <details>), rows whose explanation matters stay visible.

type How = "live" | "save" | "button" | "info";
type Row = {
  c: string;
  d: React.ReactNode;
  v?: string;
  how: How;
  s?: string;   // one-liner: the row folds, the full description sits behind it
  show?: true;  // the explanation matters: always visible
  sub?: string; // starts a small sub-group (visualizer)
  extra?: { label: string; body: React.ReactNode };
};
type Tip = { kind: "warn" | "save" | "note"; body: React.ReactNode };
type GroupId = "everyday" | "look" | "setup";
type Card = {
  id: string;
  title: string;
  summary: string;
  group: GroupId;
  intro: React.ReactNode;
  rows: Row[];
  tip?: Tip;
};

const GROUPS: { id: GroupId; title: string }[] = [
  { id: "everyday", title: "everyday" },
  { id: "look", title: "look & sound" },
  { id: "setup", title: "setup & health" },
];

const HOW: Record<How, { label: string; cls: string }> = {
  live: { label: "instant", cls: "bg-green-100 text-green-800 border-green-200" },
  save: { label: "press save", cls: "bg-amber-100 text-amber-900 border-amber-200" },
  button: { label: "button", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  info: { label: "readout", cls: "bg-blue-50 text-blue-800 border-blue-100" },
};

const EFFECTS = [
  "Plasma", "Galaxy", "Ripple", "Chevrn", "Stripe", "Soap", "Scan", "Perlin",
  "Distrt", "ZVortx", "Snakes", "Sine", "Puzzle", "GEQ2D", "Xorcry", "Hiphtc",
  "Fuzzy", "PSGlxy", "Impact", "Sonic", "Vortex", "GEQBar",
];
const VIZ_DEFAULT = ["Plasma", "Ripple", "Perlin", "Hiphtc", "GEQ2D", "Impact", "Vortex", "GEQBar"];
const AMB_DEFAULT = ["Plasma", "Galaxy", "Perlin"];
const PALETTES = [
  "Rainbow", "Analogous", "Electric", "Sunset", "Heat", "Red Tide", "Ember", "Tertiary",
  "Garnet", "Retro", "Temperature", "Clown", "Drywet", "Toxy Reaf", "Hult", "Yelblu Hot",
  "Party", "Aurora", "Aurora 2", "Splash", "Light Pink", "Tiamat", "Aqua Flash",
];

// Section screenshots in client/public/images/vizspot-controls/ (not under public/vizspot/:
// a folder named like the page makes the /vizspot static route 301 /vizspot/controls), taken from the real page
// (web_page.h) served against a mocked API, so every value shown is made up.
// Regenerate with vizSpot tools/control-page-shots/ when the control page changes.
// Width and height are the 2x image size, set to avoid layout shift.
const SHOTS: Record<string, { w: number; h: number }> = {
  header: { w: 1196, h: 188 },   // shot 600 px wide so the header stays on one line
  "now-playing": { w: 876, h: 494 },
  search: { w: 876, h: 1002 },
  mode: { w: 876, h: 520 },
  visualizer: { w: 876, h: 1634 },
  microphone: { w: 876, h: 636 },
  modes: { w: 876, h: 566 },
  ambient: { w: 876, h: 1288 },
  spotify: { w: 876, h: 1060 },
  settings: { w: 876, h: 838 },
  footer: { w: 880, h: 332 },
};

const link = "font-medium text-blue-600 underline";

const cards: Card[] = [
  {
    id: "now-playing",
    title: "now playing",
    summary: "The yellow box: song, cover, play buttons",
    group: "everyday",
    intro: "The yellow box at the very top, always open. It shows what Spotify is playing and gives you the basic remote.",
    rows: [
      {
        c: "Cover, song, artist",
        s: "What's playing right now",
        d: (
          <>
            What's playing right now. It says <b>waiting for Spotify…</b> when
            the board is signed in but hasn't heard back yet, and{" "}
            <b>Spotify not set up</b> when it isn't signed in.
          </>
        ),
        how: "info",
      },
      { c: "Progress bar", d: "How far into the song you are.", how: "info" },
      {
        c: "Status line",
        s: "Play state, time, screen, fps",
        d: (
          <>
            Playing or paused, time and length, what the panel is showing at this
            moment (<i>now playing</i>, <i>visualizer</i>, <i>ambient</i> or{" "}
            <i>status</i>), and frames per second.
          </>
        ),
        how: "info",
      },
      {
        c: "⏮ ⏯ ⏭",
        s: "Previous, play/pause, next",
        d: "Previous, play or pause, next. The middle button shows ⏸ while music plays and ▶ while it's paused. If Spotify refuses, the reason appears next to the buttons.",
        how: "button",
      },
    ],
    tip: {
      kind: "warn",
      body: (
        <>
          The buttons need <b>Spotify Premium</b> and Spotify open in the app on a
          phone or computer. The Spotify web player in a browser tab doesn't take
          remote commands.
        </>
      ),
    },
  },
  {
    id: "search",
    title: "search",
    summary: "Find a song, play or queue it",
    group: "everyday",
    intro: "Find a song and play or queue it without picking up your phone.",
    rows: [
      {
        c: "Search box + Go",
        s: "Find a song; top 10 results",
        d: "Type a song, artist or album and press Go (or Enter). Shows the top 10 tracks.",
        how: "button",
      },
      {
        c: "Play on",
        show: true,
        d: (
          <>
            Which Spotify device plays what you pick. It lists everything signed
            into your account and marks the one playing with <b>(active)</b>. It
            picks a real Spotify app over a browser player for you.
          </>
        ),
        how: "live",
      },
      { c: "↻ next to Play on", s: "Reload the device list", d: "Reloads the device list. Use it after opening Spotify somewhere new.", how: "button" },
      {
        c: "Red warning",
        show: true,
        d: "Appears if you choose a Spotify web player. Those drop off the moment they get a remote command, so pick the desktop or phone app instead.",
        how: "info",
      },
      {
        c: "▶ on a result",
        s: "Play it now; ✓ or ✗ confirms",
        d: "Plays that song now. The button flashes ✓ when Spotify accepts it, ✗ when it doesn't, with the reason underneath.",
        how: "button",
      },
      { c: "↷ on a result", s: "Add it to the queue", d: "Adds the song to the queue, after the current one.", how: "button" },
    ],
    tip: {
      kind: "warn",
      body: (
        <>
          Search talks to Spotify straight from your browser using the board's
          sign-in, so the phone or computer you're on needs internet too. If it
          says <b>no devices</b>, open the Spotify app, press play once, then tap ↻.
        </>
      ),
    },
  },
  {
    id: "mode",
    title: "mode",
    summary: "What the panel shows, and how bright",
    group: "everyday",
    intro: "What the panel shows, and how bright. On the control page this section starts open.",
    rows: [
      {
        c: "now playing",
        show: true,
        d: (
          <>
            The album cover with the artist on top and the song and progress along
            the bottom. When nothing has played for the{" "}
            <a href="#modes-ambient-after" className={link}>Ambient after</a> time,
            it drifts into ambient and comes back when music starts. The starting mode.
          </>
        ),
        how: "live",
      },
      { c: "visualizer", d: "Music-reactive effects all the time, playing or not.", how: "live" },
      { c: "ambient", d: "Slow patterns all the time.", how: "live" },
      {
        c: "cycle",
        s: "Cover and visualizer take turns",
        d: (
          <>
            While music plays, swaps between the cover and the visualizer on the
            timer in <a href="#modes" className={link}>Modes</a>. When nothing plays
            it acts like now playing.
          </>
        ),
        how: "live",
      },
      {
        c: "☀ cycle",
        s: "Next brightness step, 10–100%",
        d: "Steps to the next brightness: 10%, 30%, 50%, 90%, 100%, then back to 10%. Same as rocking the wheel on the board.",
        v: "default 100%",
        how: "button",
      },
      { c: "Brightness", s: "Current level and step", d: "The level out of 255 and which of the 5 steps it's on.", how: "info" },
      {
        c: "Power line",
        show: true,
        d: (
          <>
            Shows the panel budget. <b>POWER-LIMITED to N</b> means the board is
            holding brightness down to stay inside that budget. Raise the budget in{" "}
            <a href="#settings-panel-budget" className={link}>Settings</a> if your
            power supply can take it.
          </>
        ),
        how: "info",
      },
    ],
    tip: {
      kind: "note",
      body: "The highlighted green button is the current mode. The board remembers mode and brightness through a power cut. If Spotify isn't connected, now playing and cycle show the setup screen instead.",
    },
  },
  {
    id: "visualizer",
    title: "visualizer",
    summary: "Effects, colors, and the kaleidoscope",
    group: "look",
    intro: "The effects, their colors, and the kaleidoscope. Palette and kaleidoscope settings apply to ambient too.",
    rows: [
      { sub: "effects", c: "Next effect", s: "Crossfade to the next checked effect", d: "Crossfades to the next checked effect. Same as push-and-hold on the wheel.", how: "button" },
      { c: "now: …", d: "The effect and color palette on screen.", how: "info" },
      {
        c: "Effect checkboxes",
        show: true,
        d: "Checked effects take turns. Tap a name to jump straight to it, checked or not.",
        v: "8 of 22 checked",
        how: "live",
        extra: {
          label: "see all 22 effects",
          body: (
            <>
              <p className="mb-2 text-xs text-muted-foreground">Green = checked when new.</p>
              <Chips items={EFFECTS} marked={VIZ_DEFAULT} />
            </>
          ),
        },
      },
      { c: "Speed", s: "How fast effects move", d: "How fast the effects move.", v: "1–20 · default 8", how: "live" },
      {
        c: "Rotate every",
        s: "Seconds per effect; 0 stays put",
        d: "Seconds before the next effect. 0 stays on one effect until you change it. Ambient rotates at 3× this.",
        v: "0–3600 s · default 30",
        how: "save",
      },
      {
        c: "title strip",
        s: "Artist and song over the effects",
        d: "Artist along the top and song along the bottom, over the effects.",
        v: "default on",
        how: "save",
      },
      {
        sub: "color",
        c: "random palette on every effect change",
        s: "New colors each effect change",
        d: "A new color palette each time the effect changes, which keeps the loop feeling fresh.",
        v: "default on",
        how: "live",
      },
      {
        c: "Fixed palette",
        s: "Palette used when random is off",
        d: "The one palette to use when random is off.",
        v: "23 palettes · default Rainbow",
        how: "live",
        extra: { label: "The 23 palettes", body: <Chips items={PALETTES} marked={["Rainbow"]} /> },
      },
      {
        sub: "kaleidoscope",
        c: "Kaleidoscope",
        s: "Mirror or rotate the picture",
        d: "off, mirror left/right, mirror top/bottom, mirror 4-way, 6-fold rotation, 8-fold rotation.",
        v: "default off",
        how: "live",
      },
      { c: "Blend", s: "How strong the mirror is", d: "How strongly the mirrored image covers the original. 0% is the same as off.", v: "0–100% · default 100%", how: "live" },
      { c: "Spin", s: "Turn speed, 6- and 8-fold only", d: "How fast the pattern turns. Only the 6-fold and 8-fold modes spin.", v: "0–100% · default 20%", how: "live" },
      { c: "Slice", s: "Which part gets mirrored", d: "Which part of the picture gets mirrored. Slide it to pan.", v: "0–100% · default 50%", how: "live" },
    ],
    tip: { kind: "save", body: "stores Rotate every and title strip. Everything else here is instant." },
  },
  {
    id: "microphone",
    title: "microphone",
    summary: "What the board hears, and how loud",
    group: "look",
    intro: "The board hears the music through its own microphones. This section shows what it hears and how loud it takes it.",
    rows: [
      {
        c: "Status line",
        s: "Live sound numbers, BEAT on beats",
        d: (
          <>
            <b>live</b> with the loudness, bass, mid and treble numbers, and{" "}
            <b>BEAT</b> on each beat. <b>microphone hardware not initialised</b>{" "}
            means the mic chip didn't start, so effects won't react to sound.
          </>
        ),
        how: "info",
      },
      {
        c: "Level bar and 16 bars",
        s: "Loudness, bass left to treble right",
        d: "Overall loudness, then bass on the left through treble on the right. Updates 4 times a second.",
        how: "info",
      },
      {
        c: "Mic gain",
        show: true,
        d: "Amplification in the mic chip. Raise it if the bars barely move; lower it if they sit at the top.",
        v: "0–14 (0–37.5 dB) · default 10",
        how: "save",
      },
      {
        c: "Scale",
        s: "Fine-tune after mic gain",
        d: "A multiplier on the levels the effects see. Use it for fine tuning after mic gain.",
        v: "5–250% · default 100%",
        how: "save",
      },
    ],
    tip: {
      kind: "warn",
      body: "Play music at your normal volume and watch the 16 bars while you adjust. The loudest parts should reach near the top without staying there.",
    },
  },
  {
    id: "modes",
    title: "modes",
    summary: "Timers for cycle and ambient",
    group: "look",
    intro: "Timers for cycle and ambient, plus a separate brightness for ambient.",
    rows: [
      { c: "Cycle mode: switch every", s: "Seconds per side in cycle mode", d: "Seconds on the cover, then the same on the visualizer, in cycle mode.", v: "5–3600 s · default 30", how: "save" },
      { c: "Ambient after", s: "Idle seconds before ambient", d: "Seconds with nothing playing before now playing and cycle drift into ambient.", v: "1–3600 s · default 20", how: "save" },
      {
        c: "Ambient brightness",
        s: "A dimmer ceiling while ambient shows",
        d: "A ceiling on brightness while ambient is showing. Lower it for a gentler idle panel. It never makes ambient brighter than the Mode brightness.",
        v: "1–255 · default 255",
        how: "save",
      },
    ],
    tip: { kind: "save", body: "stores all three." },
  },
  {
    id: "ambient",
    title: "ambient",
    summary: "What plays when the music stops",
    group: "look",
    intro: "What plays when the music stops. Ambient uses the palette and kaleidoscope from the visualizer section.",
    rows: [
      {
        c: "Effect checkboxes",
        s: "Checked effects take turns",
        d: "Checked effects take turns in ambient. Tap a name to jump to it.",
        v: "3 of 22 checked",
        how: "live",
        extra: { label: "Checked when new (any of the 22 can join)", body: <Chips items={AMB_DEFAULT} marked={AMB_DEFAULT} /> },
      },
      { c: "Speed", s: "How fast patterns move", d: "How fast ambient patterns move. Slow is the point.", v: "1–20 · default 3", how: "live" },
      {
        c: "react to the microphone",
        s: "Responds to sound in the room",
        d: "Lets ambient respond to sound in the room, handy when music is playing from something other than Spotify.",
        v: "default on",
        how: "save",
      },
      {
        c: "Previously-played card every",
        show: true,
        d: "Seconds between cards that fade in the cover of something you played earlier, with how long ago. 0 turns the cards off.",
        v: "0–3600 s · default 120",
        how: "save",
      },
      { c: "hold", s: "Seconds each card stays up", d: "Seconds each card stays up.", v: "3–120 s · default 12", how: "save" },
    ],
    tip: { kind: "save", body: "stores the mic checkbox and both card timers." },
  },
  {
    id: "spotify",
    title: "spotify",
    summary: "Sign-in, and how often it checks",
    group: "setup",
    intro: "The board's Spotify sign-in and how often it checks what's playing.",
    rows: [
      {
        c: "state",
        s: "Green ok, or red with a reason",
        d: (
          <>
            Green <b>ok</b> when all is well. Red with a reason otherwise, for
            example after Spotify signs the board out at 6 months.{" "}
            <b>not configured</b> means no sign-in yet.
          </>
        ),
        how: "info",
      },
      {
        c: "Connect with your phone",
        show: true,
        d: (
          <>
            Only there while the board isn't signed in. Opens{" "}
            <a href="/vizspot/" className={link}>kpow.xyz/vizspot</a> with this
            board's code filled in. The code is also printed underneath to type on
            another phone. Same as scanning the square code on the panel.
          </>
        ),
        how: "button",
      },
      {
        c: "client_id, refresh_token, Save",
        s: "The computer way to sign in",
        d: (
          <>
            The computer way to sign in: run <Code>python3 tools/spotify_auth.py</Code>{" "}
            on a Mac and paste the two values. Save tries them right away and says{" "}
            <b>saved, connecting…</b>.
          </>
        ),
        how: "save",
      },
      {
        c: "Forget",
        show: true,
        d: "Signs the board out of Spotify and makes a new pairing code. The panel shows the square code again. Happens immediately, no confirmation.",
        how: "button",
      },
      {
        c: "Poll every",
        s: "How often it checks playback",
        d: "Milliseconds between checks on what's playing. Lower reacts to song changes sooner but asks Spotify more often.",
        v: "1000–30000 ms · default 2500",
        how: "save",
      },
      {
        c: "skip TLS verification",
        s: "Emergency fix only; leave it off",
        d: "An escape hatch for when Spotify changes its security certificates and the board can't connect. Leave it off otherwise.",
        v: "default off",
        how: "save",
      },
    ],
    tip: { kind: "save", body: "two buttons here: the top one stores the sign-in, the bottom one stores Poll every and the TLS checkbox." },
  },
  {
    id: "settings",
    title: "settings",
    summary: "Power, text speed, WiFi, starting over",
    group: "setup",
    intro: "Power, text speed, WiFi, and starting over.",
    rows: [
      {
        c: "Status line",
        s: "WiFi, address, uptime, memory",
        d: "WiFi network, the board's address and signal, the setup hotspot if it's on, minutes since start, and free memory.",
        how: "info",
      },
      {
        c: "Panel budget",
        show: true,
        d: "The most current the panel may draw. The board dims each frame just enough to stay under it. Set it a little under your power supply's rating.",
        v: "500–6000 mA · default 500",
        how: "save",
      },
      {
        c: "presets…",
        show: true,
        d: "laptop / hub USB (500), 2 A brick (1800), 3 A brick (2700), 4 A supply (3600). Picking one fills in the number; you still press Save.",
        how: "save",
      },
      { c: "Scroll speed", s: "How fast long titles slide", d: "How fast long titles slide along the text strips.", v: "4–120 px/s · default 24", how: "save" },
      {
        c: "Change WiFi",
        show: true,
        d: (
          <>
            Opens a WiFi box at the top of the page. Pick a network or type its
            name, enter the password, press Join. This page stops answering while
            the board switches; put your phone or computer on the same network and
            open <Code>vizspot.local</Code> again.
          </>
        ),
        how: "button",
      },
      { c: "Reboot", s: "Restart; nothing is lost", d: "Restarts the board. Nothing is lost. Give it up to a minute to rejoin WiFi.", how: "button" },
      {
        c: "Factory reset",
        show: true,
        d: "Asks first, then erases everything: WiFi, Spotify sign-in, pairing code and every setting. The board restarts into the SETUP hotspot, like new.",
        how: "button",
      },
    ],
    tip: { kind: "save", body: "stores Panel budget and Scroll speed." },
  },
  {
    id: "footer",
    title: "footer",
    summary: "The black strip: live health numbers",
    group: "setup",
    intro: "The black strip at the bottom is a live health check. The current mode sits top right.",
    rows: [
      { c: "IP", s: "The board's address, if .local fails", d: "The board's address. Use it when vizspot.local doesn't load.", how: "info" },
      { c: "WIFI", s: "Signal; closer to 0 is better", d: "Signal strength in dBm. Closer to 0 is better; below about −75 gets unreliable. Shows down when disconnected.", how: "info" },
      { c: "UPTIME", d: "Time since the board last started.", how: "info" },
      { c: "RENDER", d: "Frames per second the panel is drawing. Around 60 is normal.", how: "info" },
      { c: "HEAP", d: "Free memory. It should hold steady over hours.", how: "info" },
      { c: "PANEL", s: "Brightness in use; LIMITED = budget", d: "The brightness actually in use, out of 255. LIMITED means the panel budget is holding it back.", how: "info" },
      { c: "SPOTIFY", d: "The connection state, same as in the Spotify section.", how: "info" },
      { c: "BUILD", d: "The date the board's software was built.", how: "info" },
    ],
  },
];

const recipes: { title: string; body: string; to: string }[] = [
  { title: "Stay on one effect", body: "Tap the effect's name, set Rotate every to 0, press Save.", to: "visualizer" },
  { title: "Always show the cover", body: "Choose now playing. It only leaves the cover when nothing has played for a while.", to: "mode" },
  { title: "Dimmer when idle", body: "Lower Ambient brightness (try 80) and press Save.", to: "modes" },
  { title: "Visualizer barely reacts", body: "Raise Mic gain one or two steps, press Save, and watch the bars.", to: "microphone" },
  { title: "Panel red or flickery", body: "The budget is higher than your supply can give. Pick the preset that matches it and press Save.", to: "settings" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rowId = (card: Card, row: Row, i: number) => `${card.id}-${slug(row.c) || `row${i}`}`;

// Tailwind classes for native <details>: hide the marker, rotate the summary's chevron when open.
const summaryCls =
  "flex min-h-11 cursor-pointer list-none items-start gap-3 px-4 py-3 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 sm:px-5 [&::-webkit-details-marker]:hidden";
const chevronCls = "mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none";
const detailsOpenCls = "[&[open]>summary>svg]:rotate-180 [&[open]>summary>svg]:text-green-700";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[0.92em] text-gray-900">
      {children}
    </code>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-slackey text-2xl tracking-tight sm:text-3xl">{children}</h2>;
}

function Badge({ how }: { how: How }) {
  const h = HOW[how];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${h.cls}`}>
      {h.label}
    </span>
  );
}

function Chips({ items, marked }: { items: string[]; marked?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((n) => {
        const on = marked?.includes(n);
        return (
          <span
            key={n}
            className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
              on ? "border-green-300 bg-green-50 text-green-800" : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}

function Shot({ id, title, className = "" }: { id: string; title: string; className?: string }) {
  const s = SHOTS[id];
  if (!s) return null;
  return (
    <figure className={`mx-auto w-full ${className}`}>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#f2efe6] shadow-sm">
        <img
          src={`/images/vizspot-controls/${id}.png`}
          width={s.w}
          height={s.h}
          loading="lazy"
          alt={`The ${title} section of the vizSpot control page`}
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="mt-2 text-center font-mono text-[11px] uppercase tracking-wider text-gray-500">
        {title} on vizspot.local
      </figcaption>
    </figure>
  );
}

function RowView({ id, row, rowsOpen }: { id: string; row: Row; rowsOpen: boolean }) {
  const save = row.how === "save" ? <Badge how="save" /> : null;
  const value = row.v && <p className="mt-1 font-mono text-xs text-gray-500">{row.v}</p>;
  const head = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-semibold text-gray-900">{row.c}</span>
      {save}
    </div>
  );

  if (row.s) {
    return (
      <details id={id} open={rowsOpen} className={`scroll-mt-24 border-b border-gray-200 last:border-b-0 open:bg-gray-50 ${detailsOpenCls}`}>
        <summary className={summaryCls}>
          <div className="min-w-0 flex-1">
            {head}
            <p className="mt-0.5 text-sm text-muted-foreground">{row.s}</p>
          </div>
          <ChevronDown className={chevronCls} />
        </summary>
        <div className="mx-4 mb-3 border-l-2 border-green-600 pl-3 text-sm text-gray-700 sm:mx-5">
          <p>{row.d}</p>
          {value}
          {row.extra && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold text-gray-900">{row.extra.label}</p>
              {row.extra.body}
            </div>
          )}
        </div>
      </details>
    );
  }

  return (
    <div id={id} className="scroll-mt-24 border-b border-gray-200 px-4 py-3 last:border-b-0 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {head}
          <p className={`mt-0.5 text-sm ${row.show ? "text-gray-700" : "text-muted-foreground"}`}>{row.d}</p>
          {value}
        </div>
        <span className="w-4 shrink-0" aria-hidden="true" />
      </div>
      {row.extra && (
        <details open={rowsOpen} className={`mt-2 ${detailsOpenCls}`}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded text-sm font-medium text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 [&::-webkit-details-marker]:hidden">
            {row.extra.label}
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none" />
          </summary>
          <div className="mt-2">{row.extra.body}</div>
        </details>
      )}
    </div>
  );
}

function TipView({ tip, rowsOpen }: { tip: Tip; rowsOpen: boolean }) {
  if (tip.kind === "warn") {
    return (
      <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>{tip.body}</div>
      </div>
    );
  }
  if (tip.kind === "save") {
    return (
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <Badge how="save" />
        <span>{tip.body}</span>
      </p>
    );
  }
  return (
    <details open={rowsOpen} className={`mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white ${detailsOpenCls}`}>
      <summary className={summaryCls}>
        <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">good to know</span>
        <ChevronDown className={chevronCls} />
      </summary>
      <p className="px-4 pb-3 text-sm text-gray-700 sm:px-5">{tip.body}</p>
    </details>
  );
}

function SectionView({ card, rowsOpen }: { card: Card; rowsOpen: boolean }) {
  return (
    <AccordionPrimitive.Item value={card.id} id={card.id} className="scroll-mt-20 rounded-xl border border-gray-200 bg-white">
      <AccordionPrimitive.Header className="m-0">
        <AccordionPrimitive.Trigger className="flex min-h-14 w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 data-[state=open]:rounded-b-none sm:px-5 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg]:text-green-700">
          <span className="min-w-0 flex-1">
            <span className="block font-slackey text-xl tracking-tight text-gray-900">{card.title}</span>
            {/* Radix wraps the trigger in an h3, which index.css sets to Slackey. */}
            <span className="block font-sans text-sm text-muted-foreground">{card.summary}</span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      {/* No height animation: it needs overflow:hidden, which would stop the screenshot sticking. */}
      <AccordionPrimitive.Content className="border-t border-gray-200 px-4 pb-5 pt-4 sm:px-5">
        <p className="mb-4 max-w-[70ch] text-[15px] text-gray-700">{card.intro}</p>
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="sticky top-24 hidden lg:block">
            <Shot id={card.id} title={card.title} />
          </div>
          <div className="min-w-0">
            <details className={`mb-3 overflow-hidden rounded-xl border border-gray-200 lg:hidden ${detailsOpenCls}`}>
              <summary className={summaryCls}>
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-gray-800">
                  <ImageIcon className="h-4 w-4 text-gray-500" /> picture of this section
                </span>
                <ChevronDown className={chevronCls} />
              </summary>
              <div className="px-4 pb-4 sm:px-5">
                <Shot id={card.id} title={card.title} className="max-w-[360px]" />
              </div>
            </details>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {card.rows.map((row, i) => (
                <div key={i}>
                  {row.sub && (
                    <p className="border-b border-gray-200 bg-gray-50 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-500 sm:px-5">
                      {row.sub}
                    </p>
                  )}
                  <RowView id={rowId(card, row, i)} row={row} rowsOpen={rowsOpen} />
                </div>
              ))}
            </div>
            {card.tip && <TipView tip={card.tip} rowsOpen={rowsOpen} />}
          </div>
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

// Miniature of the real page: yellow now-playing box over black section bars.
function PageSketch() {
  const bars = ["SEARCH", "MODE", "VISUALIZER", "MICROPHONE", "MODES", "AMBIENT", "SPOTIFY", "SETTINGS"];
  return (
    <div className="w-full max-w-[300px] bg-[#f2efe6] p-4 font-sans text-[#111]" aria-hidden="true">
      <div className="mb-3 flex items-baseline justify-between border-b-[3px] border-[#111] pb-1.5">
        <span className="font-slackey text-2xl">vizSpot</span>
        <span className="border-2 border-[#111] bg-white px-1 text-[8px] font-extrabold tracking-wider">1 AT A TIME</span>
      </div>
      <div className="mb-3 flex items-center gap-2.5 border-[3px] border-[#111] bg-[#ffd23f] p-2 shadow-[4px_4px_0_#111]">
        <span className="h-9 w-9 shrink-0 border-2 border-[#111] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />
        <div className="min-w-0 flex-1">
          <div className="h-2 w-3/4 bg-[#111]" />
          <div className="mt-1 h-1.5 w-1/2 bg-[#111]/60" />
          <div className="mt-2 h-1.5 border border-[#111] bg-white">
            <div className="h-full w-2/5 bg-[#1db954]" />
          </div>
        </div>
      </div>
      <div className="grid gap-1.5">
        {bars.map((b) => (
          <div key={b} className="bg-[#111] px-2 py-1 text-[9px] font-extrabold tracking-[0.12em] text-[#f2efe6]">
            {b === "MODE" ? "▾ " : "▸ "}
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VizSpotControls() {
  // The first section starts open so the page has a place to begin, unless a
  // #hash link points at a section, which then opens on its own.
  const [open, setOpen] = useState<string[]>(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const linked = cards.some((c) => id === c.id || id.startsWith(`${c.id}-`));
    return linked ? [] : [cards[0].id];
  });
  const [rowsOpen, setRowsOpen] = useState(false);
  const allOpen = open.length === cards.length;

  // "#visualizer" opens that section; "#settings-panel-budget" also opens that row.
  const go = useCallback((hash: string, smooth = true) => {
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    if (!id) return;
    const card = cards.find((c) => id === c.id || id.startsWith(`${c.id}-`));
    if (card) setOpen((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
    window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" });
    }, 60);
  }, []);

  useEffect(() => {
    if (window.location.hash) go(window.location.hash, false);
    const onHash = () => go(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [go]);

  // In-page links: a hash already in the URL fires no hashchange, so handle clicks directly.
  const onClick = (e: React.MouseEvent) => {
    const href = (e.target as HTMLElement).closest("a")?.getAttribute("href");
    if (!href?.startsWith("#")) return;
    e.preventDefault();
    window.history.pushState(null, "", href);
    go(href);
  };

  const toggleAll = () => {
    if (allOpen) {
      setOpen([]);
      setRowsOpen(false);
    } else {
      setOpen(cards.map((c) => c.id));
      setRowsOpen(true);
    }
  };

  return (
    <>
      <SEO
        title="vizspot controls"
        image="/images/vizspot-hero-poster.jpg"
        description="A section-by-section guide to the vizSpot control page: modes, effects, microphone, Spotify, power and WiFi settings."
      />

      <div className="mx-auto max-w-5xl px-4 py-4" onClick={onClick}>
        {/* HERO */}
        <section className="grid items-center gap-8 border-b border-gray-200 pb-10 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[1.5px] text-green-700">
              vizspot · control page guide
            </p>
            <PageTitle size="lg" className="mb-4">
              Every control on vizspot.local.
            </PageTitle>
            <p className="mb-6 max-w-[46ch] text-[17px] text-gray-700">
              Open <Code>http://vizspot.local</Code> on a phone or computer on the
              same WiFi as the board. If that name doesn't load, type the board's
              number address instead. Open a section below to see what each control does.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button asChild className="bg-green-600 text-white hover:bg-green-700">
                <a href="#basics">Start here</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/vizspot/guide">Setup guide</a>
              </Button>
            </div>
          </div>
          <div className="grid place-items-center rounded-xl bg-[#0e1014] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.05),0_18px_50px_rgba(0,0,0,.28)] sm:p-7">
            <img
              src="/images/vizspot-off.jpg"
              width={1000}
              height={991}
              alt="A vizSpot board switched off: a frosted panel in a black frame with two skull logos, on a black stand"
              className="block h-auto w-full max-w-[420px] rounded-lg"
            />
          </div>
        </section>

        {/* BASICS: the three rules beside a sketch of the control page */}
        <section className="mt-12 scroll-mt-20" id="basics">
          <SectionHeading>how the page works</SectionHeading>
          <div className="mt-5 grid items-start gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <ul className="divide-y divide-gray-200 text-[15px] text-gray-700">
              <li className="px-4 py-3 sm:px-5">On the control page, tap a black bar to open its section.</li>
              <li className="px-4 py-3 sm:px-5">
                Anything marked <Badge how="save" /> waits for its section's green{" "}
                <b>Save</b>. Everything else acts as you touch it.
              </li>
              <li className="px-4 py-3 sm:px-5">Settings are kept on the board and survive unplugging.</li>
            </ul>
            <details id="basics-more" open={rowsOpen} className={`border-t border-gray-200 ${detailsOpenCls}`}>
              <summary className={summaryCls}>
                <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">more about the page</span>
                <ChevronDown className={chevronCls} />
              </summary>
              <div className="px-4 pb-4 sm:px-5">
                <Shot id="header" title="header" className="max-w-[600px]" />
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                  <li>The header shows playing or paused, and the current mode.</li>
                  <li>
                    <b>1 AT A TIME</b> in the header: when it's on, opening a section
                    closes the others.
                  </li>
                  <li>Your browser remembers which sections you left open. Only Mode is open the first time.</li>
                  <li>
                    Each <b>Save</b> stores only its own section and flashes <b>saved</b>.
                  </li>
                  <li>The now-playing box, readouts and footer update themselves every 2 seconds.</li>
                </ul>
              </div>
            </details>
          </div>
          <div className="grid place-items-center rounded-xl bg-[#0e1014] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.05),0_18px_50px_rgba(0,0,0,.28)] sm:p-7">
            <PageSketch />
          </div>
          </div>
        </section>

        {/* RECIPES */}
        <section className="mt-12">
          <SectionHeading>quick recipes</SectionHeading>
          <ul className="mt-5 divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {recipes.map((r) => (
              <li key={r.title} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-[15px] font-semibold text-gray-900">{r.title}</span>
                  <a href={`#${r.to}`} className="text-sm font-medium text-green-700 hover:underline">
                    {cards.find((c) => c.id === r.to)?.title} →
                  </a>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* JUMP NAV + OPEN ALL */}
        <div className="mt-12 flex items-center gap-3">
          <nav
            aria-label="Sections"
            className="-mx-4 flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto px-4 pb-1.5 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {cards.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="shrink-0 whitespace-nowrap rounded-md border-2 border-gray-900 bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-[2px_2px_0_#111] hover:bg-yellow-200"
              >
                {c.title}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleAll}
            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            {allOpen ? "close all" : "open all"}
          </button>
        </div>

        {/* SECTIONS, in three groups */}
        <AccordionPrimitive.Root type="multiple" value={open} onValueChange={setOpen}>
          {GROUPS.map((g) => (
            <section key={g.id} className="mt-10">
              <SectionHeading>{g.title}</SectionHeading>
              <div className="mt-4 grid gap-3">
                {cards
                  .filter((c) => c.group === g.id)
                  .map((card) => (
                    <SectionView key={card.id} card={card} rowsOpen={rowsOpen} />
                  ))}
              </div>
            </section>
          ))}
        </AccordionPrimitive.Root>

        {/* BACK */}
        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-[15px] text-gray-700">Setting up a board, or reconnecting Spotify?</p>
            <a
              href="/vizspot/guide"
              className="whitespace-nowrap rounded-md bg-green-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              setup guide →
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
