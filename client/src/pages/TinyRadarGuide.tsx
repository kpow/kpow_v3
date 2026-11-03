import { useEffect } from "react";
import { useLocation } from "wouter";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyRadarShell } from "@/components/tinyradar/TinyRadarShell";
import { Callout, Rich, VbLink, linkCls } from "@/components/vizbot/bits";
import { JumpBar, useActiveSection } from "@/components/vizbot/docs";
import { GuideHero, GuideSection, Media, MiniSteps, NextCards, OnThisPage, SubHead } from "@/components/tinyradar/kit/bits";
import { StepBoard, type Board } from "@/components/tinyradar/kit/StepBoard";
import { RingDevice, Scope } from "@/components/tinyradar/kit/RingDevice";
import { lookOf } from "@/components/tinyradar/kit/looks";
import { RoundScreen } from "@/components/tinyradar/kit/RoundScreen";
import { PhoneMock } from "@/components/tinyradar/kit/PhoneMock";
import {
  CAPTURES,
  DONE_CARDS,
  GUIDE_TOC,
  LOCAL_NOTE,
  LOCATION_STEPS,
  MOVED_ANCHORS,
  PASTE_NOTE,
  PHONE_SHOTS,
  PLUGIN_CARDS,
  PLUGIN_NOTE,
  SLOTS,
  WIFI_CARDS,
  WIFI_KEY,
  WIFI_NOTE,
} from "@/content/tinyradar";
import { cn } from "@/lib/utils";
import "@/components/tinyradar/kit/kit.css";

// tinyradar, part 1 of the guide: set it up. Plug in, Wi-Fi from a phone,
// location, done. Making it yours is /tinyradar/use, fixes are /tinyradar/help.
// Old anchors (#page, #button, #looks, #help, #reset, #update) moved: see
// MOVED_ANCHORS.

/** Sends old /tinyradar/guide#anchors to the page that has them now. */
function useMovedAnchors() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const check = () => {
      const to = MOVED_ANCHORS[window.location.hash.slice(1)];
      if (to) navigate(to, { replace: true });
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [navigate]);
}

function PlugIn() {
  const items: Board[] = [
    {
      bg: "photo",
      stage: <img src={CAPTURES.back.src} width={CAPTURES.back.w} height={CAPTURES.back.h} alt={CAPTURES.back.alt} loading="lazy" />,
      ...PLUGIN_CARDS[0],
    },
    SLOTS.bootClip.src
      ? { bg: "photo", stage: <Media id="bootClip" className="h-full !rounded-none !border-0" />, ...PLUGIN_CARDS[1] }
      : { bg: "dark", stage: <RingDevice size={140} screen="boot" />, ...PLUGIN_CARDS[1] },
    { bg: "dark", stage: <RingDevice size={140} screen="setup" status />, tag: { text: "Wi-Fi setup" }, ...PLUGIN_CARDS[2] },
  ];
  return (
    <GuideSection
      id="plugin"
      num={1}
      title="plug it in"
      lead="You need the radar, a USB-C cable, a USB charger and your phone."
      chips={["10 seconds", "USB-C cable", "any USB charger"]}
    >
      <div className="lg:max-w-[760px]">
        <StepBoard items={items} label="Plugging it in" />
      </div>
      <Callout className="mt-4 max-w-[760px]">
        <Rich text={PLUGIN_NOTE} />
      </Callout>
    </GuideSection>
  );
}

function Wifi() {
  const items: Board[] = [
    { bg: "top", stage: <PhoneMock kind="wifi" src={PHONE_SHOTS.wifi} width={165} />, ...WIFI_CARDS[0] },
    { bg: "top", stage: <PhoneMock kind="portal" src={PHONE_SHOTS.portal} width={165} />, tag: { text: "2.4 GHz only" }, ...WIFI_CARDS[1] },
    { bg: "top", stage: <PhoneMock kind="saved" src={PHONE_SHOTS.saved} width={165} />, ...WIFI_CARDS[2] },
    { bg: "dark", stage: <RingDevice size={140} screen="connecting" />, ...WIFI_CARDS[3] },
    { bg: "dark", stage: <RingDevice size={140} screen="location" />, tag: { text: "you're online", purple: true }, ...WIFI_CARDS[4] },
  ];
  return (
    <GuideSection
      id="wifi"
      num={2}
      title="Wi-Fi from your phone"
      lead="The radar makes its own little Wi-Fi network. Your phone joins it for a minute to tell it your home Wi-Fi."
      chips={["about 2 minutes", "your phone", "a 2.4 GHz home Wi-Fi"]}
    >
      <StepBoard items={items} label="Wi-Fi setup" />

      <SubHead>What the round screen says</SubHead>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {WIFI_KEY.map((r) => (
          <li
            key={r.k}
            className={cn(
              "flex items-center gap-3 rounded-[14px] border px-3 py-2.5",
              r.bad ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white",
            )}
          >
            <RoundScreen kind={r.screen} size={64} />
            <div className="min-w-0">
              <b className="block text-[14px] text-gray-900">{r.k}</b>
              <span className="block text-[13px] leading-snug text-gray-600">
                <Rich text={r.v} />
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Callout className="mt-4">
        <Rich text={WIFI_NOTE} />
      </Callout>
      <p className="mt-3 text-[14px] text-gray-600">
        Still stuck?{" "}
        <VbLink href="/tinyradar/help#setting-up" className={linkCls}>
          Setting up, on the help page
        </VbLink>
      </p>
    </GuideSection>
  );
}

function Location() {
  return (
    <GuideSection
      id="location"
      num={3}
      title="tell it where it is"
      lead="The radar needs to know where it is. You tell it on its own web page, from any phone or laptop on your Wi-Fi."
      chips={["about 1 minute", "phone or laptop", "same Wi-Fi as the radar"]}
    >
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <div className="min-w-0">
          <MiniSteps items={LOCATION_STEPS} />
          <details className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <summary className="cursor-pointer text-[14.5px] font-bold text-gray-900">Tip: paste coordinates instead</summary>
            <p className="m-0 mt-1.5 text-[14px] leading-relaxed text-gray-700">
              <Rich text={PASTE_NOTE} />
            </p>
          </details>
          <Callout className="mt-3">
            <Rich text={LOCAL_NOTE} />
          </Callout>
        </div>
        <figure className="m-0 grid justify-items-center gap-2 rounded-2xl border-[1.5px] border-[#0a0a0a] bg-[radial-gradient(circle_at_50%_40%,#fff,#eef2f0)] p-5 shadow-[3px_3px_0_#0a0a0a]">
          <PhoneMock kind="location" src={PHONE_SHOTS.location} width={200} />
          <figcaption className="vb-mono text-center text-[11.5px] text-gray-500">tinyradar.local, the first time</figcaption>
        </figure>
      </div>
    </GuideSection>
  );
}

function Done() {
  return (
    <GuideSection id="done" num={4} title="you're done" lead="Give it a few seconds. The rings fill with the planes around you.">
      <div className="tr-card tr-dark mb-6 flex flex-col items-center justify-center gap-5 px-4 py-7 sm:flex-row sm:gap-10">
        <figure className="m-0 grid justify-items-center gap-2">
          <RingDevice size={130} screen="nolocation" ring={{ fx: "Breathe" }} />
          <figcaption className="vb-mono text-[11.5px] text-gray-400">before: no location yet</figcaption>
        </figure>
        <span className="font-slackey text-2xl text-[#1DFF86] max-sm:rotate-90" aria-hidden="true">
          →
        </span>
        <figure className="m-0 grid justify-items-center gap-2">
          <RingDevice size={130} ring={{ fx: "Breathe" }} tOff={2} />
          <figcaption className="vb-mono text-[11.5px] text-gray-400">after: your planes</figcaption>
        </figure>
      </div>
      <NextCards
        cards={DONE_CARDS.map((c, i) => ({
          ...c,
          art:
            i === 1 ? (
              <RingDevice size={34} bare ring={{ fx: "Comet", pal: "Rainbow" }} still={3} label="" />
            ) : (
              <Scope size={44} look={lookOf(i === 0 ? "Day" : "Amber")} label="" />
            ),
        }))}
      />
    </GuideSection>
  );
}

export default function TinyRadarGuide() {
  useMovedAnchors();
  useHashScroll();
  const active = useActiveSection(GUIDE_TOC);

  return (
    <>
      <SEO />
      <TinyRadarShell>
        <GuideHero
          eyebrow="set it up · tinyradar"
          title="From the box to the planes."
          lead={
            <>
              Four steps, about five minutes. After that it just runs. Then{" "}
              <VbLink href="/tinyradar/use" className={linkCls}>
                make it yours
              </VbLink>
              , or{" "}
              <VbLink href="/tinyradar/help" className={linkCls}>
                fix something
              </VbLink>
              .
            </>
          }
        />
        <OnThisPage items={GUIDE_TOC} />
        <JumpBar items={GUIDE_TOC} active={active} />
        <PlugIn />
        <Wifi />
        <Location />
        <Done />
      </TinyRadarShell>
    </>
  );
}
