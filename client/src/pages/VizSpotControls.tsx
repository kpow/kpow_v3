import { SEO } from "@/components/global/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// User guide for the board's own control page (http://vizspot.local, served from
// github kpow/vizSpot src/net/web_page.h). Defaults and ranges come from
// src/settings.cpp and the clamps in src/net/web_api.cpp; keep them in step.

type How = "live" | "save" | "button" | "info";
type Row = { c: React.ReactNode; d: React.ReactNode; v?: string; how: How };
type Card = {
  id: string;
  title: string;
  intro: React.ReactNode;
  rows: Row[];
  tip?: React.ReactNode;
};

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

// Section screenshots in client/public/vizspot/controls/, taken from the real page
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

function Shot({ id, title }: { id: string; title: string }) {
  const s = SHOTS[id];
  if (!s) return null;
  const wide = s.w > 900;
  return (
    <figure className={`mx-auto w-full ${wide ? "max-w-[600px]" : "max-w-[440px] lg:sticky lg:top-24"}`}>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#f2efe6] shadow-sm">
        <img
          src={`/vizspot/controls/${id}.png`}
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

const cards: Card[] = [
  {
    id: "now-playing",
    title: "now playing",
    intro: (
      <>
        The yellow box at the very top, always open. It shows what Spotify is
        playing and gives you the basic remote.
      </>
    ),
    rows: [
      {
        c: "Cover, song, artist",
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
        d: (
          <>
            Previous, play or pause, next. The middle button shows ⏸ while music
            plays and ▶ while it's paused. If Spotify refuses, the reason appears
            next to the buttons.
          </>
        ),
        how: "button",
      },
    ],
    tip: (
      <>
        The buttons need <b>Spotify Premium</b> and Spotify open in the app on a
        phone or computer. The Spotify web player in a browser tab doesn't take
        remote commands.
      </>
    ),
  },
  {
    id: "search",
    title: "search",
    intro: "Find a song and play or queue it without picking up your phone.",
    rows: [
      {
        c: "Search box + Go",
        d: "Type a song, artist or album and press Go (or Enter). Shows the top 10 tracks.",
        how: "button",
      },
      {
        c: "Play on",
        d: (
          <>
            Which Spotify device plays what you pick. It lists everything signed
            into your account and marks the one playing with <b>(active)</b>.
            It picks a real Spotify app over a browser player for you.
          </>
        ),
        how: "live",
      },
      { c: "↻ next to Play on", d: "Reloads the device list. Use it after opening Spotify somewhere new.", how: "button" },
      {
        c: "Red warning",
        d: "Appears if you choose a Spotify web player. Those drop off the moment they get a remote command, so pick the desktop or phone app instead.",
        how: "info",
      },
      {
        c: "▶ on a result",
        d: "Plays that song now. The button flashes ✓ when Spotify accepts it, ✗ when it doesn't, with the reason underneath.",
        how: "button",
      },
      { c: "↷ on a result", d: "Adds the song to the queue, after the current one.", how: "button" },
    ],
    tip: (
      <>
        Search talks to Spotify straight from your browser using the board's
        sign-in, so the phone or computer you're on needs internet too. If it
        says <b>no devices</b>, open the Spotify app, press play once, then tap ↻.
      </>
    ),
  },
  {
    id: "mode",
    title: "mode",
    intro: "What the panel shows, and how bright. This section starts open.",
    rows: [
      {
        c: "now playing",
        d: (
          <>
            The album cover with the artist on top and the song and progress
            along the bottom. When nothing has played for the{" "}
            <a href="#modes" className="font-medium text-blue-600 underline">Ambient after</a>{" "}
            time, it drifts into ambient and comes back when music starts. The
            starting mode.
          </>
        ),
        how: "live",
      },
      { c: "visualizer", d: "Music-reactive effects all the time, playing or not.", how: "live" },
      { c: "ambient", d: "Slow patterns all the time.", how: "live" },
      {
        c: "cycle",
        d: (
          <>
            While music plays, swaps between the cover and the visualizer on the
            timer in{" "}
            <a href="#modes" className="font-medium text-blue-600 underline">Modes</a>.
            When nothing plays it acts like now playing.
          </>
        ),
        how: "live",
      },
      {
        c: "☀ cycle",
        d: "Steps to the next brightness: 10%, 30%, 50%, 90%, 100%, then back to 10%. Same as rocking the wheel on the board.",
        v: "default 100%",
        how: "button",
      },
      { c: "Brightness", d: "The level out of 255 and which of the 5 steps it's on.", how: "info" },
      {
        c: "Power line",
        d: (
          <>
            Shows the panel budget. <b>POWER-LIMITED to N</b> means the board is
            holding brightness down to stay inside that budget. Raise the budget
            in{" "}
            <a href="#settings" className="font-medium text-blue-600 underline">Settings</a>{" "}
            if your power supply can take it.
          </>
        ),
        how: "info",
      },
    ],
    tip: "The highlighted green button is the current mode. The board remembers mode and brightness through a power cut. If Spotify isn't connected, now playing and cycle show the setup screen instead.",
  },
  {
    id: "visualizer",
    title: "visualizer",
    intro: "The effects, their colors, and the kaleidoscope. Palette and kaleidoscope settings apply to ambient too.",
    rows: [
      { c: "Next effect", d: "Crossfades to the next checked effect. Same as push-and-hold on the wheel.", how: "button" },
      { c: "now: …", d: "The effect and color palette on screen.", how: "info" },
      {
        c: "Effect checkboxes",
        d: "Checked effects take turns. Tap a name to jump straight to it, checked or not.",
        v: "8 of 22 checked",
        how: "live",
      },
      { c: "Speed", d: "How fast the effects move.", v: "1–20 · default 8", how: "live" },
      {
        c: "Rotate every",
        d: "Seconds before the next effect. 0 stays on one effect until you change it. Ambient rotates at 3× this.",
        v: "0–3600 s · default 30",
        how: "save",
      },
      {
        c: "title strip",
        d: "Artist along the top and song along the bottom, over the effects.",
        v: "default on",
        how: "save",
      },
      {
        c: "random palette on every effect change",
        d: "A new color palette each time the effect changes, which keeps the loop feeling fresh.",
        v: "default on",
        how: "live",
      },
      {
        c: "Fixed palette",
        d: "The one palette to use when random is off.",
        v: "23 palettes · default Rainbow",
        how: "live",
      },
      {
        c: "Kaleidoscope",
        d: "off, mirror left/right, mirror top/bottom, mirror 4-way, 6-fold rotation, 8-fold rotation.",
        v: "default off",
        how: "live",
      },
      { c: "Blend", d: "How strongly the mirrored image covers the original. 0% is the same as off.", v: "0–100% · default 100%", how: "live" },
      { c: "Spin", d: "How fast the pattern turns. Only the 6-fold and 8-fold modes spin.", v: "0–100% · default 20%", how: "live" },
      { c: "Slice", d: "Which part of the picture gets mirrored. Slide it to pan.", v: "0–100% · default 50%", how: "live" },
    ],
    tip: "This section's Save stores Rotate every and title strip. Everything else here applies as you touch it.",
  },
  {
    id: "microphone",
    title: "microphone",
    intro: "The board hears the music through its own microphones. This section shows what it hears and how loud it takes it.",
    rows: [
      {
        c: "Status line",
        d: (
          <>
            <b>live</b> with the loudness, bass, mid and treble numbers, and{" "}
            <b>BEAT</b> on each beat. <b>microphone hardware not initialised</b>{" "}
            means the mic chip didn't start, so effects won't react to sound.
          </>
        ),
        how: "info",
      },
      { c: "Level bar and 16 bars", d: "Overall loudness, then bass on the left through treble on the right. Updates 4 times a second.", how: "info" },
      {
        c: "Mic gain",
        d: "Amplification in the mic chip. Raise it if the bars barely move; lower it if they sit at the top.",
        v: "0–14 (0–37.5 dB) · default 10",
        how: "save",
      },
      {
        c: "Scale",
        d: "A multiplier on the levels the effects see. Use it for fine tuning after mic gain.",
        v: "5–250% · default 100%",
        how: "save",
      },
    ],
    tip: "Play music at your normal volume and watch the 16 bars while you adjust. The loudest parts should reach near the top without staying there.",
  },
  {
    id: "modes",
    title: "modes",
    intro: "Timers for cycle and ambient, plus a separate brightness for ambient.",
    rows: [
      { c: "Cycle mode: switch every", d: "Seconds on the cover, then the same on the visualizer, in cycle mode.", v: "5–3600 s · default 30", how: "save" },
      { c: "Ambient after", d: "Seconds with nothing playing before now playing and cycle drift into ambient.", v: "1–3600 s · default 20", how: "save" },
      {
        c: "Ambient brightness",
        d: "A ceiling on brightness while ambient is showing. Lower it for a gentler idle panel. It never makes ambient brighter than the Mode brightness.",
        v: "1–255 · default 255",
        how: "save",
      },
    ],
    tip: "One Save stores all three.",
  },
  {
    id: "ambient",
    title: "ambient",
    intro: "What plays when the music stops. Ambient uses the palette and kaleidoscope from the visualizer section.",
    rows: [
      { c: "Effect checkboxes", d: "Checked effects take turns in ambient. Tap a name to jump to it.", v: "3 of 22 checked", how: "live" },
      { c: "Speed", d: "How fast ambient patterns move. Slow is the point.", v: "1–20 · default 3", how: "live" },
      {
        c: "react to the microphone",
        d: "Lets ambient respond to sound in the room, handy when music is playing from something other than Spotify.",
        v: "default on",
        how: "save",
      },
      {
        c: "Previously-played card every",
        d: "Seconds between cards that fade in the cover of something you played earlier, with how long ago. 0 turns the cards off.",
        v: "0–3600 s · default 120",
        how: "save",
      },
      { c: "hold", d: "Seconds each card stays up.", v: "3–120 s · default 12", how: "save" },
    ],
    tip: "This section's Save stores the mic checkbox and both card timers.",
  },
  {
    id: "spotify",
    title: "spotify",
    intro: "The board's Spotify sign-in and how often it checks what's playing.",
    rows: [
      {
        c: "state",
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
        d: (
          <>
            Only there while the board isn't signed in. Opens{" "}
            <a href="/vizspot/" className="font-medium text-blue-600 underline">kpow.xyz/vizspot</a>{" "}
            with this board's code filled in. The code is also printed underneath
            to type on another phone. Same as scanning the square code on the panel.
          </>
        ),
        how: "button",
      },
      {
        c: "client_id, refresh_token, Save",
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
        d: "Signs the board out of Spotify and makes a new pairing code. The panel shows the square code again. Happens immediately, no confirmation.",
        how: "button",
      },
      {
        c: "Poll every",
        d: "Milliseconds between checks on what's playing. Lower reacts to song changes sooner but asks Spotify more often.",
        v: "1000–30000 ms · default 2500",
        how: "save",
      },
      {
        c: "skip TLS verification",
        d: "An escape hatch for when Spotify changes its security certificates and the board can't connect. Leave it off otherwise.",
        v: "default off",
        how: "save",
      },
    ],
    tip: "Two Save buttons here: the top one stores the sign-in, the bottom one stores Poll every and the TLS checkbox.",
  },
  {
    id: "settings",
    title: "settings",
    intro: "Power, text speed, WiFi, and starting over.",
    rows: [
      { c: "Status line", d: "WiFi network, the board's address and signal, the setup hotspot if it's on, minutes since start, and free memory.", how: "info" },
      {
        c: "Panel budget",
        d: "The most current the panel may draw. The board dims each frame just enough to stay under it. Set it a little under your power supply's rating.",
        v: "500–6000 mA · default 500",
        how: "save",
      },
      {
        c: "presets…",
        d: "laptop / hub USB (500), 2 A brick (1800), 3 A brick (2700), 4 A supply (3600). Picking one fills in the number; you still press Save.",
        how: "save",
      },
      { c: "Scroll speed", d: "How fast long titles slide along the text strips.", v: "4–120 px/s · default 24", how: "save" },
      {
        c: "Change WiFi",
        d: (
          <>
            Opens a WiFi box at the top of the page. Pick a network or type its
            name, enter the password, press Join. This page stops answering while
            the board switches; put your phone or computer on the same network
            and open <Code>vizspot.local</Code> again.
          </>
        ),
        how: "button",
      },
      { c: "Reboot", d: "Restarts the board. Nothing is lost. Give it up to a minute to rejoin WiFi.", how: "button" },
      {
        c: "Factory reset",
        d: "Asks first, then erases everything: WiFi, Spotify sign-in, pairing code and every setting. The board restarts into the SETUP hotspot, like new.",
        how: "button",
      },
    ],
    tip: "This section's Save stores Panel budget and Scroll speed.",
  },
  {
    id: "footer",
    title: "footer",
    intro: "The black strip at the bottom is a live health check. The current mode sits top right.",
    rows: [
      { c: "IP", d: "The board's address. Use it when vizspot.local doesn't load.", how: "info" },
      { c: "WIFI", d: "Signal strength in dBm. Closer to 0 is better; below about −75 gets unreliable. Shows down when disconnected.", how: "info" },
      { c: "UPTIME", d: "Time since the board last started.", how: "info" },
      { c: "RENDER", d: "Frames per second the panel is drawing. Around 60 is normal.", how: "info" },
      { c: "HEAP", d: "Free memory. It should hold steady over hours.", how: "info" },
      { c: "PANEL", d: "The brightness actually in use, out of 255. LIMITED means the panel budget is holding it back.", how: "info" },
      { c: "SPOTIFY", d: "The connection state, same as in the Spotify section.", how: "info" },
      { c: "BUILD", d: "The date the board's software was built.", how: "info" },
    ],
  },
];

const recipes: { title: string; body: React.ReactNode }[] = [
  { title: "Stay on one effect", body: "Visualizer: tap the effect's name, set Rotate every to 0, press Save." },
  { title: "Always show the cover", body: "Mode: choose now playing. It only leaves the cover when nothing has played for a while." },
  { title: "Dimmer when idle", body: "Modes: lower Ambient brightness (try 80) and press Save." },
  { title: "Visualizer barely reacts", body: "Microphone: raise Mic gain one or two steps, press Save, and watch the bars." },
  { title: "Panel red or flickery", body: "Settings: the budget is higher than your supply can give. Pick the preset that matches it and press Save." },
];

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

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 mt-2 max-w-[70ch] text-[15px] text-muted-foreground">{children}</p>;
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
  return (
    <>
      <SEO
        title="vizspot controls"
        description="A section-by-section guide to the vizSpot control page: modes, effects, microphone, Spotify, power and WiFi settings."
      />

      <div className="mx-auto max-w-5xl px-4 py-4">
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
              number address instead. This page walks through it top to bottom.
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
            <PageSketch />
          </div>
        </section>

        {/* BASICS */}
        <section className="mt-12 scroll-mt-20" id="basics">
          <SectionHeading>how the page works</SectionHeading>
          <div className="mt-5">
            <Shot id="header" title="header" />
          </div>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-1 font-slackey text-[15px] uppercase tracking-wide">Sections fold</h3>
              <p className="text-sm text-muted-foreground">
                Tap a black bar to open or close its section. Your browser
                remembers which ones you left open. Only Mode is open the first time.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-1 font-slackey text-[15px] uppercase tracking-wide">1 at a time</h3>
              <p className="text-sm text-muted-foreground">
                The switch in the header. When it's on, opening a section closes
                the others. Next to it: playing or paused, and the current mode.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-1 font-slackey text-[15px] uppercase tracking-wide">Instant or save</h3>
              <p className="text-sm text-muted-foreground">
                Buttons, sliders, dropdowns and the effect checkboxes act the
                moment you touch them. Number boxes and the other checkboxes wait
                for their section's green <b>Save</b>, which stores only that
                section and flashes <b>saved</b>. The tables below mark each one.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-1 font-slackey text-[15px] uppercase tracking-wide">Kept on the board</h3>
              <p className="text-sm text-muted-foreground">
                What you change is stored on the board and survives unplugging.
                The now-playing box, readouts and footer update themselves every
                2 seconds.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>In the tables below:</span>
            {(Object.keys(HOW) as How[]).map((h) => (
              <Badge key={h} how={h} />
            ))}
          </div>
        </section>

        {/* JUMP NAV */}
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Sections">
          {cards.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-md border-2 border-gray-900 bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-[2px_2px_0_#111] hover:bg-yellow-200"
            >
              {c.title}
            </a>
          ))}
        </nav>

        {/* SECTIONS */}
        {cards.map((card) => (
          <section key={card.id} id={card.id} className="mt-12 scroll-mt-20">
            <SectionHeading>{card.title}</SectionHeading>
            <Lead>{card.intro}</Lead>
            <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <Shot id={card.id} title={card.title} />
            <div className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {card.rows.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-1 gap-1.5 px-5 py-4 sm:grid-cols-[170px_1fr] sm:gap-4 sm:px-6 ${
                    i < card.rows.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 sm:block">
                    <div className="text-sm font-semibold text-gray-900">{row.c}</div>
                    <div className="sm:mt-1.5">
                      <Badge how={row.how} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>{row.d}</p>
                    {row.v && <p className="mt-1 font-mono text-xs text-gray-500">{row.v}</p>}
                  </div>
                </div>
              ))}
            </div>
            {card.id === "visualizer" && (
              <div className="mt-4 grid gap-4 rounded-xl border border-gray-200 bg-white p-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    The 22 effects <span className="font-normal text-muted-foreground">(green = checked when new)</span>
                  </p>
                  <Chips items={EFFECTS} marked={VIZ_DEFAULT} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-900">The 23 palettes</p>
                  <Chips items={PALETTES} marked={["Rainbow"]} />
                </div>
              </div>
            )}
            {card.id === "ambient" && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  Checked when new <span className="font-normal text-muted-foreground">(any of the 22 can join)</span>
                </p>
                <Chips items={AMB_DEFAULT} marked={AMB_DEFAULT} />
              </div>
            )}
            {card.tip && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{card.tip}</div>
              </div>
            )}
            </div>
            </div>
          </section>
        ))}

        {/* RECIPES */}
        <section className="mt-12">
          <SectionHeading>quick recipes</SectionHeading>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {recipes.map((r) => (
              <div key={r.title} className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-1 text-[15px] font-semibold text-gray-900">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

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
