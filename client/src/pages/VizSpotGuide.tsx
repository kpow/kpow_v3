import { SEO } from "@/components/global/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// Guide for people who've been given a vizSpot board. Facts here must match the
// firmware (github kpow/vizSpot, docs/user-guide.md): screens, wheel mapping,
// 6-month Spotify sign-out, power behaviour. The phone setup page is /vizspot/
// (static, served by server/routes/vizspot-routes.ts), so link it with <a>, not <Link>.

const features: { title: string; body: string }[] = [
  {
    title: "Now playing",
    body: "The album cover of whatever you're playing on Spotify, with the artist along the top and the song and progress along the bottom.",
  },
  {
    title: "Visualizer",
    body: "22 effects that react to the music through the board's own microphones, with a new color palette every time the effect changes.",
  },
  {
    title: "Ambient",
    body: "Slow patterns when nothing's playing. Every couple of minutes a cover you played earlier fades in.",
  },
  {
    title: "Cycle",
    body: "Alternates between the cover and the visualizer on a timer you choose.",
  },
];

const setupSteps: React.ReactNode[] = [
  <>
    Plug in the power supply that came with the board. It shows <b>vizSpot</b>,
    then a <b>SETUP</b> screen with a network name like <Code>vizSpot-A1B2</Code>.
  </>,
  <>
    On your phone, join that WiFi network. There's no password. A setup page
    opens; if it doesn't, go to <Code>192.168.4.1</Code>. Pick your home WiFi
    and enter its password.
  </>,
  <>
    The board joins your WiFi, which can take up to a minute. Then it shows a
    square code that alternates with a card reading{" "}
    <Code>KPOW.XYZ/VIZSPOT</Code> and a 16-character code.
  </>,
  <>
    Point your phone camera at the square code and tap the link. Or open{" "}
    <a href="/vizspot/" className="font-medium text-blue-600 underline">
      kpow.xyz/vizspot
    </a>{" "}
    and type the code from the card.
  </>,
  <>
    Follow the steps on the page. You create a small Spotify app of your own
    (about 5 minutes, only once), paste its Client ID, and sign in. When it
    says <b>You're connected</b>, play something on Spotify.
  </>,
];

const wheel: { k: string; v: string }[] = [
  { k: "Push", v: "switch between the cover and the visualizer" },
  { k: "Push and hold", v: "next effect" },
  { k: "Rock up", v: "brighter" },
  { k: "Rock down", v: "dimmer" },
];

const fixes: { title: string; body: React.ReactNode }[] = [
  {
    title: "The panel looks red or blotchy",
    body: "It isn't getting enough power. Use the supply that came with it, not a laptop USB port or a phone charger.",
  },
  {
    title: "The panel is dim",
    body: (
      <>
        It starts gentle so it's safe on any USB port. On the control page,
        open <b>Settings</b> and set <b>Panel budget</b> to match your power
        supply.
      </>
    ),
  },
  {
    title: "My phone won't read the square code",
    body: (
      <>
        Hold the phone about 50 cm away; up close the LEDs confuse the camera.
        Or wait for the card and type the code at{" "}
        <a href="/vizspot/" className="font-medium text-blue-600 underline">
          kpow.xyz/vizspot
        </a>
        .
      </>
    ),
  },
  {
    title: "The setup page keeps waiting for the board",
    body: "Unplug the board and plug it back in. The code stays the same, and the board checks in quickly right after it starts.",
  },
  {
    title: "The card says RELAY OFFLINE",
    body: "The board can't reach the internet. Check your WiFi; it keeps retrying on its own.",
  },
  {
    title: "Play buttons say no active device",
    body: "Start Spotify playing in the Spotify app on your phone or computer first. The Spotify web player in a browser tab doesn't take remote commands.",
  },
];

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[0.92em] text-gray-900">
      {children}
    </code>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-slackey text-2xl tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 mt-3 max-w-[70ch] text-[15px] text-muted-foreground">
      {children}
    </p>
  );
}

function Step({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <span className="grid h-8 w-8 shrink-0 place-content-center rounded-lg bg-green-600 font-slackey text-sm text-white">
        {index}
      </span>
      <div className="text-[15px] leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}

export default function VizSpotGuide() {
  return (
    <>
      <SEO
        title="vizspot"
        image="/images/vizspot-on.jpg"
        description="vizSpot: a 64x64 LED board that shows what you're playing on Spotify, reacts to the music, and sets up from your phone."
      />

      <div className="mx-auto max-w-4xl px-4 py-4">
        {/* HERO */}
        <section className="grid items-center gap-8 border-b border-gray-200 pb-10 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[1.5px] text-green-700">
              spotify on a led panel · user guide
            </p>
            <PageTitle size="lg" className="mb-4">
              Your music, 64×64 pixels.
            </PageTitle>
            <p className="mb-6 max-w-[46ch] text-[17px] text-gray-700">
              vizSpot is a small LED board that shows the cover of whatever
              you're playing on Spotify, dances to the music, and drifts into
              ambient patterns when nothing's on. You set it up from your phone.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button asChild className="bg-green-600 text-white hover:bg-green-700">
                <a href="#setup">Set it up</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/vizspot/">Connect Spotify</a>
              </Button>
            </div>
          </div>
          <div className="grid place-items-center rounded-xl bg-[#0e1014] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.05),0_18px_50px_rgba(0,0,0,.28)] sm:p-7">
            <video
              src="/images/vizspot-hero.mp4"
              poster="/images/vizspot-hero-poster.jpg"
              width={900}
              height={792}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="A vizSpot board on a desk, its LED panel showing music"
              className="block h-auto w-full max-w-[420px] rounded-lg"
            />
          </div>
        </section>

        {/* OFF AND ON */}
        <section className="mt-12">
          <SectionHeading>off and on</SectionHeading>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img
                src="/images/vizspot-off.jpg"
                width={1400}
                height={1388}
                loading="lazy"
                alt="A vizSpot board switched off: a frosted grey panel in a black frame with two skull logos, on a black stand"
                className="block h-auto w-full"
              />
              <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                <b className="text-gray-900">Off.</b> A frosted panel in a black
                frame, quiet on a shelf.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img
                src="/images/vizspot-on.jpg"
                width={1400}
                height={1285}
                loading="lazy"
                alt="The same board switched on, showing De La Soul's The Magic Number cover with the artist along the top and the song along the bottom"
                className="block h-auto w-full"
              />
              <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                <b className="text-gray-900">On.</b> The diffuser blends 4,096
                LEDs into the cover of whatever's playing, with the artist on top
                and the song along the bottom.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* WHAT IT DOES */}
        <section className="mt-12">
          <SectionHeading>what it does</SectionHeading>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-1 font-slackey text-[15px] uppercase tracking-wide">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SETUP */}
        <section className="mt-12 scroll-mt-20" id="setup">
          <SectionHeading>set it up</SectionHeading>
          <Lead>
            You'll need <b>Spotify Premium</b>, a phone, and your home WiFi.
            Budget about 10 minutes the first time.
          </Lead>
          <div className="grid gap-3">
            {setupSteps.map((step, i) => (
              <Step key={i} index={i + 1}>
                {step}
              </Step>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <b>2.4GHz WiFi only.</b> The board has no 5GHz radio, so pick your
              2.4GHz network.
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Your Spotify sign-in is encrypted on your phone for your board.
            kpow.xyz only passes it along and can't read it.
          </p>
        </section>

        {/* USING IT */}
        <section className="mt-12">
          <SectionHeading>using it</SectionHeading>
          <Lead>
            The little wheel on the side of the board does the everyday things.
          </Lead>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {wheel.map((row, i) => (
              <div
                key={row.k}
                className={`grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-4 sm:px-6 ${
                  i < wheel.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <span className="text-sm font-semibold text-gray-800">{row.k}</span>
                <span className="text-sm text-gray-900">{row.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-[15px] text-gray-700">
            <p>
              For everything else, open <Code>http://vizspot.local</Code> on a
              phone or computer on the same WiFi. If that name doesn't load, use
              the address the board showed during setup. From there you can
              choose modes and effects, change colors and speed, search Spotify,
              and play or pause.
            </p>
            <p className="mt-3">
              <a href="/vizspot/controls" className="font-medium text-blue-600 underline">
                Control page guide →
              </a>{" "}
              every section and setting, explained.
            </p>
          </div>
        </section>

        {/* EVERY 6 MONTHS */}
        <section className="mt-12">
          <SectionHeading>every 6 months</SectionHeading>
          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-6 text-[15px] text-gray-700">
            <p>
              Spotify signs the board out 6 months after you connect. That's
              Spotify's rule, however often you use it. The board shows{" "}
              <b>SIGN-IN EXPIRED</b> and the square code again. Scan it: the page
              remembers your Spotify app, so reconnecting takes about 30 seconds.
            </p>
          </div>
        </section>

        {/* TROUBLESHOOTING */}
        <section className="mt-12">
          <SectionHeading>if something's off</SectionHeading>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {fixes.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-1 text-[15px] font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONNECT */}
        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-[15px] text-gray-700">
              Ready to connect, or reconnecting after 6 months?
            </p>
            <a
              href="/vizspot/"
              className="whitespace-nowrap rounded-md bg-green-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              connect spotify →
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
