import { ChevronDown } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { VizMacShell } from "@/components/vizmac/VizMacShell";
import { ControllerFrame } from "@/components/vizmac/frames";
import { Bullets, ButtonCard, Pointer, Rows, ShotPlaceholder, TocFooter } from "@/components/vizmac/bits";
import { Callout, Chip, Code, Lead, Rich, SectionHeading, Step, SubHead } from "@/components/vizbot/bits";
import { DocHero, JumpBar, Toc, sectionCls, useActiveSection } from "@/components/vizbot/docs";
import {
  EFFECT_GROUPS,
  FIXES,
  GUIDE_TOC,
  MENUBAR_SHOT,
  MENU_GROUPS,
  PAIRING_STEPS,
  PHOTOS,
  WEB_CONTROLLER,
  WEB_EFFECTS,
  WEB_KEYBOARD,
  WEB_LIGHTS,
} from "@/content/vizmac";
import { cn } from "@/lib/utils";

// vizMac user guide: the Mac side (menu bar app, web UI) and the fixes. The
// controller has its own page, /vizmac/controller; here it's a pointer card that
// keeps the #controller anchor alive. Layout from the comps (docs/site/guide.html
// in the vizMac repo), on vizBot's doc frame: DocHero, sticky Toc, JumpBar.

const MacOnly = () => <Chip>Mac only</Chip>;

function MenuBar() {
  return (
    <section id="menubar" className={cn("mt-9 lg:mt-10", sectionCls)}>
      <SectionHeading num={1}>the menu bar app</SectionHeading>
      <Lead>Click the skull. Quick switches live here. Everything else is in the web UI.</Lead>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Rows groups={MENU_GROUPS} cols="sm:grid-cols-[190px_1fr]" />
        <figure className="m-0 max-w-[300px]">
          <img
            src={MENUBAR_SHOT.src}
            width={MENUBAR_SHOT.w}
            height={MENUBAR_SHOT.h}
            alt={MENUBAR_SHOT.alt}
            loading="lazy"
            className="block h-auto w-full rounded-xl border border-gray-200 shadow-sm"
          />
          <figcaption className="vb-mono mt-2 text-center text-xs text-muted-foreground">the skull menu</figcaption>
        </figure>
      </div>
    </section>
  );
}

function WebUI() {
  return (
    <section id="web" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={2}>the web UI</SectionHeading>
      <Lead>
        Skull menu › <b className="font-bold text-gray-900">Open Web UI…</b> On the Mac it's{" "}
        <Code>http://127.0.0.1:4049</Code>. Cards marked <MacOnly /> don't show on a phone.
      </Lead>
      <ShotPlaceholder
        className="aspect-[16/7] w-full"
        title="screenshot coming"
        body="The web UI on the Mac: the effect list, a live copy of the keyboard, and the cards below."
      />

      <SubHead>Effects and palettes</SubHead>
      <Bullets items={WEB_EFFECTS} />
      <Rows rows={EFFECT_GROUPS} cols="sm:grid-cols-[120px_1fr]" className="mt-4" />

      <SubHead>The Keyboard card</SubHead>
      <ul className="grid gap-1.5 text-[15px] leading-relaxed text-gray-700">
        {WEB_KEYBOARD.map((t) => (
          <li key={t} className="flex gap-2.5">
            <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-[var(--vb-yellow)]" aria-hidden="true" />
            <span>
              <Rich text={t} slots={{ maconly: <MacOnly /> }} />
            </span>
          </li>
        ))}
      </ul>

      <SubHead id="pairing">Wi-Fi access and the pairing code</SubHead>
      <p className="mb-3.5 max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        Off by default: only this Mac can use vizMac. To let the controller or a phone in:
      </p>
      <div className="grid gap-2.5">
        {PAIRING_STEPS.map((s, i) => (
          <Step key={i} n={i + 1}>
            <Rich text={s} />
          </Step>
        ))}
      </div>
      <Callout className="mt-3.5">
        <b className="font-bold text-gray-900">The Mac stays in charge.</b> Only the Mac can switch Wi-Fi access, see the
        code or make a new one.
      </Callout>

      <SubHead>
        The Controller card <MacOnly />
      </SubHead>
      <Bullets items={WEB_CONTROLLER} />

      <SubHead id="lights">
        The Lights card <MacOnly />
      </SubHead>
      <p className="mb-3.5 max-w-[68ch] text-[15px] leading-relaxed text-gray-700">
        vizMac finds the WLED lights on your Wi-Fi by itself. This card picks which ones the controller's WLED mode lists,
        and in which order.
      </p>
      <Rows rows={WEB_LIGHTS} cols="sm:grid-cols-[120px_1fr]" />
    </section>
  );
}

function Controller() {
  return (
    <section id="controller" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={3}>the controller</SectionHeading>
      <Pointer
        className="mt-5"
        href="/vizmac/controller"
        title="It has its own page."
        body="Buttons and shortcuts, the four modes, sleep, Wi-Fi setup and updates."
        cta="Open the controller page"
        art={
          <ControllerFrame
            screen="m-top-keys"
            leds="m-top-keys-leds"
            alt="The mode picker on the Keys card"
            className="[--sw:104px]"
          />
        }
      />
    </section>
  );
}

function Help() {
  return (
    <section id="help" className={cn("mt-14 md:mt-16", sectionCls)}>
      <SectionHeading num={4}>if something's off</SectionHeading>
      <Lead>
        Logs: <Code>~/Library/Logs/vizMac/vizmac.log</Code>
      </Lead>
      {/* phones: disclosures; wider: cards */}
      <div className="mt-[18px] grid gap-2 md:hidden">
        {FIXES.map((f, i) => (
          <details key={f.title} open={i === 0} className="rounded-[10px] border border-gray-200 bg-white">
            <summary className="flex cursor-pointer items-center justify-between gap-2.5 px-3.5 py-[13px] text-[15px] font-bold text-gray-900">
              {f.title}
              <ChevronDown className="vb-chev h-4 w-4 flex-none text-gray-600" />
            </summary>
            <p className="px-3.5 pb-3.5 text-sm leading-relaxed text-gray-700">
              <Rich text={f.body} />
            </p>
          </details>
        ))}
      </div>
      <div className="mt-5 hidden gap-3.5 md:grid md:grid-cols-2">
        {FIXES.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-[18px]">
            <h3 className="vb-plain mb-1.5 text-[15px] font-bold text-gray-900">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <Rich text={f.body} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function VizMacGuide() {
  const active = useActiveSection(GUIDE_TOC);
  useHashScroll();

  return (
    <>
      <SEO
        title="vizMac user guide"
        description="The vizMac menu bar app and web UI: effects and palettes, the keyboard, Wi-Fi access and pairing, controller updates, WLED lights, and fixes for common problems."
        image={PHOTOS.hero.src}
        keywords="vizMac, user guide, ROCCAT Vulcan Pro TKL, macOS, menu bar, WLED"
      />
      <VizMacShell>
        <DocHero
          eyebrow="user guide · the Mac side"
          title="Getting going with vizMac."
          lead={
            <>
              The menu bar app, the web UI and fixes. The controller has its own page. To set it up from source, see{" "}
              <span className="vb-mono text-[.92em]">docs/getting-started.md</span> in the repo.
            </>
          }
          quick={[
            { t: "The skull menu", d: "Quick switches on the Mac.", href: "menubar", n: 1 },
            { t: "The web UI", d: "Effects, pairing, lights, updates.", href: "web", n: 2 },
            { t: "Stuck?", d: "Common problems and fixes.", href: "help", n: 4 },
          ]}
        />
        <JumpBar items={GUIDE_TOC} active={active} />
        <div className="mt-2 grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Toc
            items={GUIDE_TOC}
            active={active}
            label="Guide sections"
            footer={<TocFooter other={{ href: "/vizmac/controller", label: "The controller page" }} />}
          >
            <ButtonCard />
          </Toc>
          <div className="min-w-0">
            <MenuBar />
            <WebUI />
            <Controller />
            <Help />
          </div>
        </div>
      </VizMacShell>
    </>
  );
}
