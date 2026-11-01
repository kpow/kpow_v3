import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Clock, Download, ShieldCheck, Usb } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyRadarShell } from "@/components/tinyradar/TinyRadarShell";
import { Bullets } from "@/components/labz/bits";
import { Callout, Code, Eyebrow, Lead, NumBadge, Rich, SectionHeading, VbLink, linkCls } from "@/components/vizbot/bits";
import {
  FILE_NOTE,
  FILE_STEPS,
  INSTALL_STEPS,
  MAKER_STEPS,
  MANIFEST_URL,
  UPDATE_SAFE,
  type Manifest,
} from "@/content/tinyradar";
import { formatSize } from "@/lib/vizbot";

// tinyradar updates. The radar's own web page does the installing: it reads the
// same manifest.json this page does (server/routes/tinyradar-routes.ts serves it
// with CORS) and streams the .bin to the radar. This page says what's new, how
// to install it, and offers the file for "Install from a file". The private
// GitHub releases never show up here: scripts/publish-tinyradar-firmware.mjs
// copies a release's files into client/public/tinyradar/firmware/.

/** null = no release published yet (404). */
async function fetchManifest(): Promise<Manifest | null> {
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function StepLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="vb-mono mb-3 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[1.3px] text-gray-600">
      <span className="text-green-800">{n}</span>
      {children}
    </p>
  );
}

function NumList({ items, slots }: { items: readonly string[]; slots?: Record<string, React.ReactNode> }) {
  return (
    <ol className="grid gap-2.5">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <NumBadge n={i + 1} size={24} />
          <span className="pt-0.5 text-[14.5px] leading-normal text-gray-700 [overflow-wrap:anywhere]">
            <Rich text={s} slots={slots} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function Head({ m }: { m: Manifest | null | undefined }) {
  return (
    <div className="flex flex-col items-start gap-2.5 bg-[#0e1014] p-[18px] text-white md:flex-row md:items-center md:justify-between md:gap-4 md:px-[26px] md:py-5">
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="vb-mono rounded-full bg-[#1DFF86] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[1.2px] text-[#0a0a0a]">
          {m ? "latest" : "coming soon"}
        </span>
        <span className="font-slackey text-[28px] leading-none md:text-[32px]">{m ? `v${m.version}` : "tinyradar firmware"}</span>
        {m?.notes ? <span className="text-[15px] text-gray-300 md:text-[17px]">{m.notes}</span> : null}
      </div>
    </div>
  );
}

function FilePanel({ m, state }: { m: Manifest | null | undefined; state: "loading" | "error" | "ready" }) {
  if (state === "loading") {
    return (
      <div>
        <StepLabel n="or">download the file</StepLabel>
        <div className="h-[58px] animate-pulse rounded-[10px] bg-gray-200" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div>
        <StepLabel n="or">download the file</StepLabel>
        <Callout kind="warn">Couldn't load the release info. Try again in a minute.</Callout>
      </div>
    );
  }
  const b = m?.builds.s3;
  if (!m || !b) {
    return (
      <div>
        <StepLabel n="or">download the file</StepLabel>
        <div className="rounded-[10px] border border-dashed border-gray-300 bg-white px-4 py-5 text-center">
          <Clock className="mx-auto h-6 w-6 text-green-800" aria-hidden="true" />
          <p className="mt-2 font-slackey text-lg leading-tight">No update yet.</p>
          <p className="mt-1.5 text-[14px] leading-normal text-muted-foreground">
            Nothing is published here yet. When a new version is, it shows up here and on the radar's own page.
          </p>
        </div>
      </div>
    );
  }
  const href = new URL(b.url, new URL(MANIFEST_URL, window.location.origin)).pathname;
  return (
    <div>
      <StepLabel n="or">download the file</StepLabel>
      <a href={href} className="vb-btn vb-btn-primary vb-btn-big vb-focus" download>
        <Download className="h-5 w-5 flex-none" strokeWidth={2.2} aria-hidden="true" />
        <span>Download v{m.version}</span>
      </a>
      <div className="mt-2.5 flex items-center justify-between gap-2.5">
        <span className="vb-mono break-all text-[13px] text-gray-900">{b.url}</span>
        <span className="flex-none text-[13px] text-muted-foreground">{formatSize(b.size)}</span>
      </div>
      <p className="vb-mono mt-1 break-all text-[11.5px] text-gray-500">md5 {b.md5}</p>
      <div className="mt-5">
        <NumList items={FILE_STEPS} />
        <p className="mt-3 text-[13px] leading-normal text-muted-foreground">
          <Rich text={FILE_NOTE} />
        </p>
      </div>
    </div>
  );
}

function Latest() {
  const { data, isLoading, isError } = useQuery({ queryKey: [MANIFEST_URL], queryFn: fetchManifest, staleTime: 60_000 });
  const state = isLoading ? "loading" : isError ? "error" : "ready";
  const version = data?.version ?? "…";
  return (
    <section
      id="latest"
      className="mt-7 scroll-mt-24 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_12px_30px_-22px_rgba(0,0,0,.45)] md:mt-9"
    >
      <Head m={state === "ready" ? data : null} />
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="px-4 py-[18px] md:px-[26px] md:py-6 lg:border-r lg:border-gray-200">
          <StepLabel n="1">install it from the radar</StepLabel>
          <NumList items={INSTALL_STEPS} slots={{ version: <b className="font-bold text-gray-900">{version}</b> }} />
          <p className="mt-3 text-[13px] leading-normal text-muted-foreground">
            The radar's page checks this site each time you open it. Nothing to download by hand.{" "}
            <VbLink href="/tinyradar/guide#update" className={linkCls}>
              Updates in the guide
            </VbLink>
          </p>
        </div>
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-[18px] md:px-[26px] md:py-6 lg:border-t-0">
          <FilePanel m={data} state={state} />
        </div>
      </div>
    </section>
  );
}

function Safe() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>it can't break</SectionHeading>
      <Lead>Updates go into a spare slot. The old version stays put until the new one has proved it works.</Lead>
      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-[18px] md:px-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[var(--vb-yellow)]">
          <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.9} />
        </span>
        <Bullets items={UPDATE_SAFE} />
      </div>
    </section>
  );
}

function Maker() {
  return (
    <section className="mt-5">
      <details id="usb" className="scroll-mt-24 rounded-xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer items-center gap-3 p-3.5 md:px-5 md:py-4">
          <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] bg-gray-100">
            <Usb className="h-[18px] w-[18px] text-gray-700" aria-hidden="true" />
          </span>
          <span className="block flex-1">
            <span className="block text-[15.5px] font-bold text-gray-900">First flash over USB</span>
            <span className="block text-[13px] text-muted-foreground">For the maker, once per board, before it's given away.</span>
          </span>
          <ChevronDown className="vb-chev h-[18px] w-[18px] flex-none text-gray-600" />
        </summary>
        <div className="px-3.5 pb-4 md:pb-5 md:pl-[66px] md:pr-5">
          <p className="mb-3.5 max-w-[70ch] text-[14.5px] leading-relaxed text-gray-700">
            A new board needs the radar's partition layout once, over a cable. After that every update is over Wi-Fi.
            The USB image (<Code>-full.bin</Code>) is on the GitHub release, not here.
          </p>
          <NumList items={MAKER_STEPS} />
        </div>
      </details>
    </section>
  );
}

export default function TinyRadarUpdate() {
  useHashScroll();
  return (
    <>
      <SEO />
      <TinyRadarShell>
        <section className="border-b border-gray-200 pb-7 md:pb-9">
          <Eyebrow>updates · tinyradar</Eyebrow>
          <h1 className="mb-3.5 font-slackey text-[34px] font-normal leading-[1.08] md:text-[46px]">Keep it up to date.</h1>
          <p className="max-w-[56ch] text-base leading-relaxed text-gray-700 md:text-[17px]">
            The newest tinyradar firmware and how to put it on your radar. It installs from the radar's own web page in
            about 2 minutes and keeps your settings.
          </p>
        </section>
        <Latest />
        <Safe />
        <Maker />
      </TinyRadarShell>
    </>
  );
}
