import { SEO } from "@/components/global/SEO";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const pieces: { img: string; title: string; sub: string }[] = [
  { img: "/images/4x4.jpg", title: "4×4 grid", sub: "16 pixels" },
  { img: "/images/5x5.jpg", title: "5×5 grid", sub: "25 pixels" },
  { img: "/images/8x8.jpg", title: "8×8 grid", sub: "64 pixels" },
  { img: "/images/led-bug.jpg", title: "bug statue", sub: "LEDs built in" },
];

const specs: { k: string; v: React.ReactNode }[] = [
  {
    k: "Controller board",
    v: "ESP32-C3 Super Mini / ESP32-S3 Zero",
  },
  { k: "LEDs", v: "WS2812B addressable RGB (5V, single-wire)" },
  {
    k: "Data pin",
    v: (
      <>
        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[13px] text-blue-700">
          GPIO 4
        </span>{" "}
        — same on every piece
      </>
    ),
  },
  { k: "Firmware", v: "WLED" },
  {
    k: "Power",
    v: "USB-C · brightness preset low, any standard supply works",
  },
];

const connectSteps: React.ReactNode[] = [
  "Plug the piece into USB-C power and let it boot.",
  <>
    On your phone, open WiFi and join the network named <b>WLED-AP</b>.
    Password: <Code>wled1234</Code>
  </>,
  <>
    A control page should open automatically. If it doesn't, go to{" "}
    <Code>http://4.3.2.1</Code> in a browser.
  </>,
  "You're in. Pick effects and colors right away.",
];

const wifiSteps: React.ReactNode[] = [
  <>
    In the control page, open <b>Config → WiFi Setup</b>.
  </>,
  "Enter your network name and password, give the piece a name, and save. It reboots and joins your WiFi.",
  <>
    From then on, reach it at <Code>http://[name].local</Code> or its IP address
    (shown in the WLED info page or your router).
  </>,
];

const features: { title: string; body: string }[] = [
  { title: "Effects", body: "Pick any of 100+ animations from the FX tab." },
  {
    title: "Colors & palettes",
    body: "Set base colors or a full palette per effect.",
  },
  {
    title: "Presets",
    body: "Save a color + effect combo and recall it in one tap.",
  },
  {
    title: "Segments",
    body: "Split a grid into zones running different effects — handy on the 8×8.",
  },
];

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[0.92em] text-gray-900">
      {children}
    </code>
  );
}

function BoardCard({ src, label }: { src: string; label: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <img
        src={src}
        alt={label}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
      <figcaption className="px-4 py-3 font-mono text-xs text-muted-foreground">
        {label}
      </figcaption>
    </figure>
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
    <p className="-mt-2 mb-6 max-w-[70ch] text-[15px] text-muted-foreground">
      {children}
    </p>
  );
}

function Step({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <span className="grid h-8 w-8 shrink-0 place-content-center rounded-lg bg-blue-600 font-slackey text-sm text-white">
        {index}
      </span>
      <div className="text-[15px] leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}

export default function LedArt() {
  return (
    <>
      <SEO
        title="led art"
        description="Hand-built addressable-LED desktop art running WLED — ESP32 + WS2812B. Control colors and effects from any browser."
        image="/phash.jpg"
        type="website"
      />

      <div className="mx-auto max-w-4xl px-4 py-4">
        {/* HERO */}
        <section className="grid items-center gap-8 border-b border-gray-200 pb-10 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[1.5px] text-blue-600">
              desktop led art · running wled
            </p>
            <PageTitle size="lg" className="mb-4">
              Pixel grids and bugs that light up.
            </PageTitle>
            <p className="mb-6 max-w-[46ch] text-[17px] text-gray-700">
              Hand-built addressable-LED pieces driven by a tiny ESP32 and WLED
              firmware. Connect over WiFi from any phone or browser to change
              colors, brightness, and effects. No app to install.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <a href="#connect">How to connect</a>
              </Button>
              <Button asChild variant="outline">
                <a href="#inside">What's inside</a>
              </Button>
            </div>
          </div>
          <div className="grid place-items-center rounded-xl bg-[#0e1014] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.05),0_18px_50px_rgba(0,0,0,.28)] sm:p-7">
            <video
              src="/images/hero.mp4"
              poster="/images/hero-poster.jpg"
              autoPlay
              loop
              muted
              playsInline
              className="block w-full max-w-[360px] rounded-lg"
            />
          </div>
        </section>

        {/* THE PIECES */}
        <section className="mt-12" id="pieces">
          <SectionHeading>the pieces</SectionHeading>
          <p className="mb-6 mt-3 max-w-[70ch] text-[15px] text-muted-foreground">
            Every piece is the same electronics in a different body — addressable
            RGB pixels you control from a browser.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {pieces.map((piece) => (
              <div
                key={piece.title}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="grid place-items-center bg-[#0e1014] p-3">
                  <img
                    src={piece.img}
                    alt={piece.title}
                    loading="lazy"
                    className="aspect-square w-full object-contain"
                  />
                </div>
                <div className="px-4 py-4">
                  <h3 className="font-slackey text-lg uppercase tracking-wide">
                    {piece.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    {piece.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT'S INSIDE */}
        <section className="mt-12 scroll-mt-20" id="inside">
          <SectionHeading>what's inside</SectionHeading>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BoardCard src="/images/c3.png" label="ESP32-C3 Super Mini" />
            <BoardCard src="/images/s3.png" label="ESP32-S3 Zero" />
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {specs.map((row, i) => (
              <div
                key={row.k}
                className={`grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-4 sm:px-6 ${
                  i < specs.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <span className="text-sm font-semibold text-gray-800">
                  {row.k}
                </span>
                <span className="font-mono text-sm text-gray-900">{row.v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT IS WLED */}
        <section className="mt-12">
          <SectionHeading>what is wled</SectionHeading>
          <div className="mt-5 space-y-3 rounded-xl border border-gray-200 bg-white p-6 text-[15px] text-gray-700">
            <p>
              WLED is open-source firmware that runs on the ESP32 inside each
              piece. It serves a small web interface, so you control the LEDs
              from a phone or computer browser — there's nothing to install.
            </p>
            <p>
              It ships with 100+ animated effects and color palettes, and lets
              you save your favorites as presets.
            </p>
          </div>
        </section>

        {/* CONNECT */}
        <section className="mt-12 scroll-mt-20" id="connect">
          <SectionHeading>first connection</SectionHeading>
          <Lead>
            Out of the box, each piece makes its own WiFi network so you can
            reach the controls before it knows about yours.
          </Lead>
          <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
            <div className="grid gap-3">
              {connectSteps.map((step, i) => (
                <Step key={i} index={i + 1}>
                  {step}
                </Step>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <figure>
                <img
                  src="/images/wled-iphone.png"
                  alt="Joining the WLED-AP WiFi network on a phone"
                  loading="lazy"
                  className="w-full rounded-xl border border-gray-200"
                />
                <figcaption className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
                  join WLED-AP
                </figcaption>
              </figure>
              <figure>
                <img
                  src="/images/wled.png"
                  alt="WLED control page on a phone"
                  loading="lazy"
                  className="w-full rounded-xl border border-gray-200"
                />
                <figcaption className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
                  control page
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* HOME WIFI */}
        <section className="mt-12">
          <SectionHeading>put it on your wifi</SectionHeading>
          <Lead>
            Optional, but it lets you control the piece without switching
            networks every time.
          </Lead>
          <div className="grid gap-3">
            {wifiSteps.map((step, i) => (
              <Step key={i} index={i + 1}>
                {step}
              </Step>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <b>2.4GHz only.</b> The ESP32 has no 5GHz radio — connect it to
              your 2.4GHz network.
            </div>
          </div>
        </section>

        {/* CONTROL */}
        <section className="mt-12">
          <SectionHeading>control the effects</SectionHeading>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <h3 className="mb-1 font-slackey text-[15px] uppercase tracking-wide">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LEARN MORE */}
        <section className="mt-12">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <SectionHeading>go deeper</SectionHeading>
            <a
              href="https://kno.wled.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              full wled docs →
            </a>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-[15px] text-gray-700">
            <p>
              Everything above covers the basics. For the complete reference —
              presets, playlists, sync, automation, and the API — head to the
              official WLED knowledge base.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
