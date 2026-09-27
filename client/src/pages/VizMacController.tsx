import { ChevronDown } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { VizMacShell } from "@/components/vizmac/VizMacShell";
import {
  Bullets,
  ButtonCard,
  GlyphRows,
  HueDot,
  ModeAside,
  Rows,
  ScreenRow,
  ShotPlaceholder,
  TocFooter,
} from "@/components/vizmac/bits";
import { Callout, Lead, Rich, SectionHeading, Step, SubHead, VbLink, linkCls } from "@/components/vizbot/bits";
import { DocHero, JumpBar, Toc, sectionCls, useActiveSection } from "@/components/vizbot/docs";
import {
  BUILDER_NOTES,
  CLOCK_FACE,
  CLOCK_SHOTS,
  CONTROLLER_TOC,
  CONTROLS,
  FW_LABEL,
  HUE,
  KBLED_STEPS,
  KEYS_CONTROLS,
  KEYS_MENU,
  MODE_PICKER,
  NP_CONTROLS,
  NP_NOTES,
  NP_PALETTE_STEPS,
  NP_SHOTS,
  PAIR_SCREENS,
  PHOTOS,
  PICKER_SHOTS,
  SHORTCUTS,
  SLEEP,
  TIMER_DONE,
  TIMER_STEPS,
  UPDATE_STEPS,
  WIFI_AGAIN,
  WIFI_ERRORS,
  WIFI_SHOTS,
  WIFI_STEPS,
  WLED_LIGHT,
  WLED_LIST,
  WLED_STEPS,
  shot,
} from "@/content/vizmac";
import { cn } from "@/lib/utils";

// vizMac controller: the buttons, the mode picker, Keyboard LEDs, sleep, the four
// modes, Wi-Fi setup and updates. The sibling of /vizbot/touch. Copy from the
// comps (docs/site/guide.html in the vizMac repo), checked against the firmware.

function Steps({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2.5">
      {items.map((s, i) => (
        <Step key={i} n={i + 1}>
          <Rich text={s} />
        </Step>
      ))}
    </div>
  );
}

function Shot({ id, caption, alt }: { id: string; caption: string; alt: string }) {
  return (
    <figure className="m-0">
      <img src={shot(id)} alt={alt} width={240} height={320} loading="lazy" className="vb-shot w-[140px] rounded-md" />
      <figcaption className="vb-mono mt-2 text-center text-[11px] text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

function ModeHeading({ num, id, children }: { num: number; id: keyof typeof HUE; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <SectionHeading num={num}>{children}</SectionHeading>
      <HueDot color={HUE[id]} />
    </div>
  );
}

function Buttons() {
  return (
    <section id="buttons" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>buttons</SectionHeading>
      <Lead>
        A 240 × 320 screen, a knob you can push, one button called KO, and 16 × 8 LEDs on top. It finds vizMac on your
        Wi-Fi by itself.
      </Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div>
          <GlyphRows rows={CONTROLS.map((c) => ({ glyph: c.glyph, k: c.k, v: c.long }))} />
          <Callout className="mt-3.5">
            <b className="font-bold text-gray-900">Read the bottom line.</b> Every screen ends with what turn, KO and push
            do right now. The holds aren't listed there.
          </Callout>
        </div>
        <ModeAside
          className="hidden lg:flex"
          screen="m-top-keys"
          leds="m-top-keys-leds"
          alt="The mode picker, Keys card"
          caption="the mode picker"
        />
      </div>
      <SubHead id="shortcuts">Shortcuts: hold KO</SubHead>
      <Rows rows={SHORTCUTS} cols="sm:grid-cols-[230px_1fr]" />
    </section>
  );
}

function Modes() {
  return (
    <section id="modes" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={2}>the mode picker</SectionHeading>
      <Lead>The top level. Four cards, one per mode. The modes keep running while you're elsewhere.</Lead>
      <Bullets items={MODE_PICKER} />
      <p className="mt-2.5 text-sm text-muted-foreground">It starts up in the mode you used last.</p>
      <ScreenRow shots={PICKER_SHOTS} className="mt-4" />
    </section>
  );
}

function KeyboardLeds() {
  return (
    <section id="kbleds" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>Keyboard LEDs</SectionHeading>
      <Lead>
        Each mode draws its own thing on the 16 × 8 LEDs. To show the keyboard's effect there in every mode instead:
      </Lead>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Steps items={KBLED_STEPS} />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">The focus-timer alert still flashes either way.</p>
        </div>
        <div className="flex gap-3.5">
          <Shot id="m-keys-leds" caption="each mode's own" alt="Keyboard page, Keyboard LEDs off: Each mode's own" />
          <Shot id="m-keys-leds-always" caption="in every mode" alt="Keyboard page, Keyboard LEDs on: In every mode" />
        </div>
      </div>
    </section>
  );
}

function Sleep() {
  return (
    <section id="sleep" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>sleep</SectionHeading>
      <Lead>It goes dark on its own when the Mac does, and wakes with it.</Lead>
      <Bullets items={SLEEP} />
    </section>
  );
}

function Keys() {
  return (
    <section id="keys" className={cn("mt-14 md:mt-16", sectionCls)}>
      <ModeHeading num={5} id="keys">
        Keys
      </ModeHeading>
      <Lead>The keyboard's effect. The LEDs show the keyboard, live.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div>
          <p className="mb-3 text-[15px] leading-relaxed text-gray-700">
            The main page: the effect, its group, where it sits in that group (like{" "}
            <b className="font-bold text-gray-900">8 of 17</b>), its palette, and three chips: keyboard, brightness, audio.
          </p>
          <GlyphRows rows={KEYS_CONTROLS} />
        </div>
        <ModeAside
          screen="m-keys-main"
          leds="m-keys-main-leds"
          alt="Keys main page: Plasma, Noodle, 1 of 17, Aurora palette"
          caption="keys · main page"
        />
      </div>
      <SubHead>The Menu</SubHead>
      <p className="mb-3.5 max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        KO on the main page. Four tiles: turn to move, KO opens one, push closes the Menu.
      </p>
      <Rows rows={KEYS_MENU} cols="sm:grid-cols-[130px_1fr]" />
      <Callout className="mt-3.5">
        <b className="font-bold text-gray-900">LEDs upside down?</b> Status ›{" "}
        <b className="font-bold text-gray-900">LED panels</b>. Turn each panel until the test pattern is the right way up.
        It also sets which panel the data enters, and the LED brightness.
      </Callout>
    </section>
  );
}

function NowPlaying() {
  return (
    <section id="np" className={cn("mt-14 md:mt-16", sectionCls)}>
      <ModeHeading num={6} id="np">
        Now Playing
      </ModeHeading>
      <Lead>Spotify or Music, whichever is playing. vizMac never opens them for you.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div>
          <GlyphRows rows={NP_CONTROLS} />
          <Bullets items={NP_NOTES} className="mt-4" />
        </div>
        <ModeAside
          screen="m-np-main"
          leds="np-eq-leds"
          alt="Now Playing: album art, Midnight City by M83, 1:42 of 4:03, Spotify"
          caption="now playing · rainbow eq"
        />
      </div>
      <SubHead>Pick the EQ palette</SubHead>
      <Steps items={NP_PALETTE_STEPS} />
      <SubHead>Other screens</SubHead>
      <ScreenRow shots={NP_SHOTS}>
        <figure className="m-0 flex-none">
          <img
            src={PHOTOS.npPaused.src}
            alt={PHOTOS.npPaused.alt}
            width={PHOTOS.npPaused.w}
            height={PHOTOS.npPaused.h}
            loading="lazy"
            className="h-[200px] w-auto rounded-md object-cover"
          />
          <figcaption className="vb-mono mt-2 text-center text-[11px] text-muted-foreground">paused, from Music</figcaption>
        </figure>
      </ScreenRow>
      <Callout kind="warn" className="mt-4">
        <b className="font-bold text-gray-900">Only Spotify and Music.</b> Since macOS 15.4, other apps can't read the
        system's Now Playing, so a browser tab won't show up. "Spotify is closed" means neither app is open.
      </Callout>
    </section>
  );
}

function Clock() {
  return (
    <section id="clock" className={cn("mt-14 md:mt-16", sectionCls)}>
      <ModeHeading num={7} id="clock">
        Clock and focus timer
      </ModeHeading>
      <Lead>An analog face on the screen, the time as digits on the LEDs. The focus timer lives on the dial.</Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <Bullets items={CLOCK_FACE.map((c) => c.text)} dots={CLOCK_FACE.map((c) => c.dot)} />
        <ModeAside
          screen="f-instrument-1010"
          leds="f-instrument-1010-leds"
          alt="Clock: the Instrument face at 10:10, Focus 25 min ready"
          caption="clock · timer ready"
        />
      </div>
      <SubHead>Run a focus timer</SubHead>
      <Steps items={TIMER_STEPS} />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Push leaves the Clock. The timer keeps running, and the Clock card in the mode picker shows the time left.
      </p>
      <ScreenRow shots={CLOCK_SHOTS} className="mt-4" />
      <SubHead>When it ends</SubHead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <Bullets items={TIMER_DONE} />
        <ModeAside
          screen="m-clock-done"
          leds="m-clock-done-leds"
          alt="Focus done: 25 min, 3 done today"
          caption="focus done · leds flash green"
        />
      </div>
    </section>
  );
}

function Wled() {
  return (
    <section id="wled" className={cn("mt-14 md:mt-16", sectionCls)}>
      <ModeHeading num={8} id="wled">
        WLED
      </ModeHeading>
      <Lead>
        Your WLED lights, the ones you pick on the Mac. The controller talks to them directly, so this works with the Mac
        asleep.
      </Lead>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div>
          <Steps items={WLED_STEPS} />
          <SubHead>The list</SubHead>
          <Rows rows={WLED_LIST} cols="sm:grid-cols-[130px_1fr]" />
        </div>
        <ModeAside
          screen="m-wled-list"
          leds="m-wled-list-leds"
          alt="WLED list: All lights, then Desk, Shelf, Window, TV glow and Hall"
          caption="wled · the list"
        />
      </div>
      <SubHead>A light's page</SubHead>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        <Rows rows={WLED_LIGHT} cols="sm:grid-cols-[150px_1fr]" />
        <div className="flex gap-3.5">
          <Shot id="m-wled-device" caption="a light" alt="A light's page: Brightness 70%, Light on, Preset Reading, Effect Solid" />
          <Shot id="m-wled-presets" caption="presets" alt="Presets list with Reading ticked and Focus about to apply" />
        </div>
      </div>
      <Callout className="mt-4">
        <b className="font-bold text-gray-900">Need more?</b> Segments, playlists and settings stay in WLED. Use{" "}
        <b className="font-bold text-gray-900">Open</b> in the{" "}
        <VbLink href="/vizmac/guide#lights" className={linkCls}>
          Lights card
        </VbLink>
        .
      </Callout>
    </section>
  );
}

function Wifi() {
  return (
    <section id="wifi" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={9}>Wi-Fi setup</SectionHeading>
      <Lead>
        The controller joins your Wi-Fi with help from your phone. The first time it starts, it goes straight to this.
      </Lead>
      <Steps items={WIFI_STEPS} />
      <Callout kind="warn" className="mt-4">
        <b className="font-bold text-gray-900">2.4 GHz only.</b> The ESP32-S3 has no 5 GHz radio. If your router splits the
        bands into two names, pick the 2.4 one.
      </Callout>
      <ScreenRow shots={WIFI_SHOTS} className="mt-4">
        <ShotPlaceholder
          className="w-[200px] flex-none"
          title="screenshot coming"
          body="The setup page on the phone, with its list of networks."
        />
      </ScreenRow>

      <SubHead>If it can't join</SubHead>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="mb-3 text-[15px] leading-relaxed text-gray-700">
            The screen and the phone both say why. Fix it on the phone and tap Connect again.
          </p>
          <Rows rows={WIFI_ERRORS} cols="sm:grid-cols-[170px_1fr]" />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            KO shows the QR again, for when the phone dropped off. Push cancels and goes back to the saved network, if
            there is one.
          </p>
        </div>
        <Shot id="w-fail" caption="couldn't join" alt="Couldn't join: Wrong password" />
      </div>

      <SubHead>Set it up again later</SubHead>
      <Bullets items={WIFI_AGAIN} />

      <SubHead id="pair">Pairing with the Mac</SubHead>
      <p className="mb-3 max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        Once it's on Wi-Fi, it looks for vizMac by name. vizMac needs{" "}
        <VbLink href="/vizmac/guide#pairing" className={linkCls}>
          Wi-Fi access
        </VbLink>{" "}
        on.
      </p>
      <Rows rows={PAIR_SCREENS} cols="sm:grid-cols-[170px_1fr]" />
    </section>
  );
}

function Updates() {
  return (
    <section id="update" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={10}>updates</SectionHeading>
      <Lead>
        vizMac carries the controller's firmware. Updating is one click and about a minute, over Wi-Fi. The controller
        keeps its Wi-Fi and pairing code.
      </Lead>
      <Steps items={UPDATE_STEPS} />
      <div className="mt-3.5 grid gap-2.5">
        <Callout>
          <b className="font-bold text-gray-900">It fails safe.</b> A bad or cut-off download shows{" "}
          <b className="font-bold text-gray-900">Update failed</b> and why. The old firmware keeps running.
        </Callout>
        <Callout kind="warn">
          <b className="font-bold text-gray-900">"Update it once over USB"?</b> That controller's firmware is older than
          web updates. Flash it once with a cable (below). After that, the button works.
        </Callout>
      </div>
      <details className="mt-4 rounded-xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer items-center justify-between gap-2.5 px-4 py-3.5 text-[15px] font-bold text-gray-900">
          For builders: USB, over Wi-Fi, and the bundle
          <ChevronDown className="vb-chev h-4 w-4 flex-none text-gray-600" />
        </summary>
        <div className="grid gap-2 px-4 pb-4 text-sm leading-relaxed text-gray-700">
          {BUILDER_NOTES.map((t) => (
            <p key={t}>
              <Rich text={t} />
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}

export default function VizMacController() {
  const active = useActiveSection(CONTROLLER_TOC);
  useHashScroll();

  return (
    <>
      <SEO
        title="vizMac controller"
        description="The vizMac desk controller: the knob and KO button, the mode picker, Keys, Now Playing, the Clock and focus timer, WLED, Wi-Fi setup from your phone, and updates."
        image={PHOTOS.hero.src}
        keywords="vizMac, controller, macropad, ESP32-S3, Now Playing, focus timer, WLED"
      />
      <VizMacShell>
        <DocHero
          eyebrow={`the controller · firmware ${FW_LABEL}`}
          title="One knob, four modes."
          lead="Every button and every mode, setting it up on your Wi-Fi from your phone, and keeping it updated. The Mac side is in the user guide."
          quick={[
            { t: "Which button?", d: "The controller in one table.", href: "buttons", n: 1 },
            { t: "New controller?", d: "Wi-Fi setup from your phone.", href: "wifi", n: 9 },
            { t: "Updating?", d: "One click in the web UI.", href: "update", n: 10 },
          ]}
        />
        <JumpBar items={CONTROLLER_TOC} active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc
            items={CONTROLLER_TOC}
            active={active}
            label="Controller sections"
            footer={<TocFooter other={{ href: "/vizmac/guide", label: "The user guide" }} />}
          >
            <ButtonCard />
          </Toc>
          <div className="min-w-0">
            <Buttons />
            <Modes />
            <KeyboardLeds />
            <Sleep />
            <Keys />
            <NowPlaying />
            <Clock />
            <Wled />
            <Wifi />
            <Updates />
          </div>
        </div>
      </VizMacShell>
    </>
  );
}
