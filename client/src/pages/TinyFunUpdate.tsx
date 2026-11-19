import { useQuery } from "@tanstack/react-query";
import { Clock, Download, ShieldCheck, Wifi } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { useHashScroll } from "@/components/vizbot/VizBotShell";
import { TinyFunShell } from "@/components/tinyfun/TinyFunShell";
import { Bullets } from "@/components/labz/bits";
import { Callout, Code, Eyebrow, Lead, NumBadge, Rich, SectionHeading } from "@/components/vizbot/bits";
import { FixList, SubHead } from "@/components/tinyradar/kit/bits";
import { MANIFEST_URL, UPDATE_AFTER, UPDATE_FIXES, UPDATE_SAFE, UPDATE_STEPS, type Manifest } from "@/content/tinyfun";
import { formatSize } from "@/lib/vizbot";

// tinyfun updates. tinyfun has no internet: the phone downloads the .bin here
// first, then joins tinyfun's own hotspot and uploads it to the console's page
// at 192.168.4.1 (tinyfun/OtaMode.cpp in the kFun repo). The private GitHub
// releases never show up here: scripts/publish-tinyfun-firmware.mjs copies a
// release's files into firmware/tinyfun/ (served by server/routes/tinyfun-routes.ts).

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
      <span className="text-lime-800">{n}</span>
      {children}
    </p>
  );
}

function NumList({ items, slots }: { items: readonly string[]; slots?: Record<string, React.ReactNode> }) {
  return (
    <ol className="grid gap-3">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <NumBadge n={i + 1} size={26} />
          <span className="pt-0.5 text-[15px] leading-normal text-gray-700 [overflow-wrap:anywhere]">
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
        <span className="vb-mono rounded-full bg-[var(--vb-yellow)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[1.2px] text-[#0a0a0a]">
          {m ? "latest" : "coming soon"}
        </span>
        <span className="font-slackey text-[28px] leading-none md:text-[32px]">{m ? `v${m.version}` : "tinyfun firmware"}</span>
        {m?.notes ? <span className="text-[15px] text-gray-300 md:text-[17px]">{m.notes}</span> : null}
      </div>
    </div>
  );
}

function FilePanel({ m, state }: { m: Manifest | null | undefined; state: "loading" | "error" | "ready" }) {
  const label = <StepLabel n="1">get the file</StepLabel>;
  if (state === "loading") {
    return (
      <div>
        {label}
        <div className="h-[58px] animate-pulse rounded-[10px] bg-gray-200" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div>
        {label}
        <Callout kind="warn">Couldn't load the newest version. Try again in a minute.</Callout>
      </div>
    );
  }
  const b = m?.builds.s3;
  if (!m || !b) {
    return (
      <div>
        {label}
        <div className="rounded-[10px] border border-dashed border-gray-300 bg-white px-4 py-5 text-center">
          <Clock className="mx-auto h-6 w-6 text-lime-800" aria-hidden="true" />
          <p className="mt-2 font-slackey text-lg leading-tight">No update yet.</p>
          <p className="mt-1.5 text-[14px] leading-normal text-muted-foreground">
            Nothing to download yet. When there's a new version, it shows up here.
          </p>
        </div>
      </div>
    );
  }
  const href = new URL(b.url, new URL(MANIFEST_URL, window.location.origin)).pathname;
  return (
    <div>
      {label}
      <a href={href} className="vb-btn vb-btn-primary vb-btn-big vb-focus" download>
        <Download className="h-5 w-5 flex-none" strokeWidth={2.2} aria-hidden="true" />
        <span>Download v{m.version}</span>
      </a>
      <div className="mt-2.5 flex items-center justify-between gap-2.5">
        <span className="vb-mono break-all text-[13px] text-gray-900">{b.url}</span>
        <span className="flex-none text-[13px] text-muted-foreground">{formatSize(b.size)}</span>
      </div>
      <p className="vb-mono mt-1 break-all text-[11.5px] text-gray-500">md5 {b.md5}</p>
      <p className="mt-3 text-[13.5px] leading-normal text-muted-foreground">
        Download it on the phone you'll use for the next part.
      </p>
    </div>
  );
}

function Latest() {
  const { data, isLoading, isError } = useQuery({ queryKey: [MANIFEST_URL], queryFn: fetchManifest, staleTime: 60_000 });
  const state = isLoading ? "loading" : isError ? "error" : "ready";
  const b = state === "ready" ? data?.builds.s3 : undefined;
  const file = b ? <Code>{b.url}</Code> : <>the downloaded <Code>.bin</Code> file</>;
  return (
    <section
      id="latest"
      className="mt-7 scroll-mt-24 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_12px_30px_-22px_rgba(0,0,0,.45)] md:mt-9"
    >
      <Head m={state === "ready" ? data : null} />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-[18px] md:px-[26px] md:py-6 lg:border-b-0 lg:border-r">
          <FilePanel m={data} state={state} />
        </div>
        <div className="px-4 py-[18px] md:px-[26px] md:py-6">
          <StepLabel n="2">send it to tinyfun</StepLabel>
          <NumList items={UPDATE_STEPS} slots={{ file }} />
          <p className="mt-4 text-[13px] leading-normal text-muted-foreground">
            About 2 minutes. <a href="#wrong" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">If something goes wrong</a>
          </p>
        </div>
      </div>
    </section>
  );
}

function After() {
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>Afterwards</SectionHeading>
      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-[18px] md:px-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[var(--vb-yellow)]">
          <Wifi className="h-[22px] w-[22px]" strokeWidth={1.9} />
        </span>
        <Bullets items={UPDATE_AFTER} />
      </div>
    </section>
  );
}

function Wrong() {
  return (
    <section id="wrong" className="mt-12 scroll-mt-24 md:mt-14">
      <SectionHeading>If something goes wrong</SectionHeading>
      <Lead>A failed upload changes nothing on tinyfun.</Lead>
      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-[18px] md:px-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border-[1.5px] border-[#0a0a0a] bg-[var(--vb-yellow)]">
          <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.9} />
        </span>
        <Bullets items={UPDATE_SAFE} />
      </div>
      <SubHead>What the screen says</SubHead>
      <FixList items={UPDATE_FIXES} />
    </section>
  );
}

export default function TinyFunUpdate() {
  useHashScroll();
  return (
    <>
      <SEO />
      <TinyFunShell>
        <section className="border-b border-gray-200 pb-7 md:pb-9">
          <Eyebrow>updates · tinyfun</Eyebrow>
          <h1 className="mb-3.5 font-slackey text-[34px] font-normal leading-[1.08] md:text-[46px]">Keep it up to date.</h1>
          <p className="max-w-[56ch] text-base leading-relaxed text-gray-700 md:text-[17px]">
            tinyfun has no internet. Your phone gets the new version first, then hands it to tinyfun over tinyfun's own
            Wi-Fi.
          </p>
        </section>
        <Latest />
        <After />
        <Wrong />
      </TinyFunShell>
    </>
  );
}
