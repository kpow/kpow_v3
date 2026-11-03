import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyRadarShell } from "@/components/tinyradar/TinyRadarShell";
import { Callout, Rich, VbLink, linkCls } from "@/components/vizbot/bits";
import { JumpBar, useActiveSection } from "@/components/vizbot/docs";
import { FixList, GuideHero, GuideSection, MiniSteps, OnThisPage, Shot } from "@/components/tinyradar/kit/bits";
import { RingDevice } from "@/components/tinyradar/kit/RingDevice";
import { RoundScreen } from "@/components/tinyradar/kit/RoundScreen";
import { PhoneMock } from "@/components/tinyradar/kit/PhoneMock";
import {
  CAPTURES,
  HELP_ITSELF,
  HELP_SCREEN,
  HELP_SETUP,
  HELP_TOC,
  MOVED_NOTE,
  MOVED_STEPS,
  RESET_STEPS,
} from "@/content/tinyradar";
import "@/components/tinyradar/kit/kit.css";

// tinyradar, part 3 of the guide: fix it. Short answers that link back to the
// step that explains more. Update problems live on /tinyradar/update.

/** A picture beside the answers: stacked on phones. */
function Split({ art, children }: { art: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
      <div className="min-w-0">{children}</div>
      <div className="mx-auto w-full max-w-[260px] lg:order-none">{art}</div>
    </div>
  );
}

function DarkArt({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="m-0">
      <div className="tr-card tr-dark flex items-center justify-center gap-4 px-4 py-6">{children}</div>
      <figcaption className="vb-mono mt-2 text-center text-[11.5px] text-gray-500">{caption}</figcaption>
    </figure>
  );
}

export default function TinyRadarHelp() {
  useHashScroll();
  const active = useActiveSection(HELP_TOC);
  return (
    <>
      <SEO />
      <TinyRadarShell>
        <GuideHero
          eyebrow="fix it · tinyradar"
          title="Something's off?"
          lead={
            <>
              What usually goes wrong, in two lines each. Most of it fixes itself. Update trouble is on{" "}
              <VbLink href="/tinyradar/update#safe" className={linkCls}>
                the updates page
              </VbLink>
              .
            </>
          }
        />
        <OnThisPage items={HELP_TOC} />
        <JumpBar items={HELP_TOC} active={active} />

        <GuideSection id="setting-up" num={1} title="setting up" lead="Joining the radar's setup network, and finding it afterwards.">
          <Split
            art={
              <figure className="m-0 grid justify-items-center gap-2 rounded-2xl border-[1.5px] border-[#0a0a0a] bg-[radial-gradient(circle_at_50%_40%,#fff,#eef2f0)] p-5 shadow-[3px_3px_0_#0a0a0a]">
                <div className="flex items-center gap-3">
                  <RoundScreen kind="setup" size={86} />
                  <PhoneMock kind="wifi" width={120} />
                </div>
                <figcaption className="vb-mono text-center text-[11.5px] text-gray-500">yellow screen = setup network is on</figcaption>
              </figure>
            }
          >
            <FixList items={HELP_SETUP} />
          </Split>
        </GuideSection>

        <GuideSection id="screen" num={2} title="on the screen" lead="When the round screen isn't showing what you expect.">
          <Split
            art={
              <DarkArt caption="no location yet: rings, a sweep, a card">
                <RingDevice size={150} screen="nolocation" noRing />
              </DarkArt>
            }
          >
            <FixList items={HELP_SCREEN} />
          </Split>
        </GuideSection>

        <GuideSection id="moved" num={3} title="moved or new router" lead="Change Wi-Fi puts the radar back into setup for a new network. No cable, no button inside.">
          <Split art={<Shot img={CAPTURES.wifi} caption="Settings › Wi-Fi" />}>
            <MiniSteps items={MOVED_STEPS} />
            <Callout className="mt-4">
              <Rich text={MOVED_NOTE} />
            </Callout>
          </Split>
        </GuideSection>

        <GuideSection id="reset" num={4} title="start over" lead="A restart fixes most things. A factory reset makes it like new.">
          <Split art={<Shot img={CAPTURES.advanced} caption="Settings › About and help › Advanced" />}>
            <MiniSteps items={RESET_STEPS} />
          </Split>
        </GuideSection>

        <GuideSection id="itself" num={5} title="things that fix themselves" lead="Nothing to do for these. Leave it plugged in.">
          <Split
            art={
              <DarkArt caption="an update that didn't take">
                <RoundScreen kind="updatefail" size={130} />
              </DarkArt>
            }
          >
            <FixList items={HELP_ITSELF} />
          </Split>
        </GuideSection>
      </TinyRadarShell>
    </>
  );
}
