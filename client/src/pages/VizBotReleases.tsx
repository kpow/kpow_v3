import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, Download, ExternalLink, Usb } from "lucide-react";
import { SEO } from "@/components/global/SEO";
import { Markdown } from "@/components/buildlog/Markdown";
import { VizBotShell, useHashScroll } from "@/components/vizbot/VizBotShell";
import { BoardIcon } from "@/components/vizbot/icons";
import { Callout, Code, Eyebrow, Lead, NumBadge, Rich, SectionHeading, VbLink, linkCls } from "@/components/vizbot/bits";
import {
  BOARDS,
  BOARD_BY_ID,
  DOC_VERSION,
  INSTALL_STEPS,
  RELEASES_URL,
  SCREENS,
  USB_STEPS,
  factoryFileName,
  isBoardId,
  otaFileName,
  type Board,
  type BoardId,
} from "@/content/vizbot";
import {
  assetFor,
  formatDate,
  formatSize,
  isLegacy,
  loadBoard,
  releaseTitle,
  saveBoard,
  splitReleases,
  useVizbotReleases,
  versionOf,
  type VizbotAsset,
  type VizbotRelease,
} from "@/lib/vizbot";
import { cn } from "@/lib/utils";

// vizBot downloads. Picker -> one OTA file for that board -> three install steps.
// The -factory.bin files live only inside "First install over USB": they pass
// the bot's filename check too, so the page never offers them for a WiFi update.
// Only releases with major >= 3 count as current; 2.x is legacy.

function initialBoard(): BoardId {
  try {
    const q = new URLSearchParams(window.location.search).get("board");
    if (isBoardId(q)) return q;
  } catch {
    /* ignore */
  }
  const saved = loadBoard();
  return isBoardId(saved) ? saved : "lcd169";
}

function StepLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="vb-mono mb-3 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[1.3px] text-gray-600">
      <span className="text-yellow-800">{n}</span>
      {children}
    </p>
  );
}

// ------------------------------------------------------------------ picker

function BoardPicker({ value, onChange }: { value: BoardId; onChange: (b: BoardId) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + BOARDS.length) % BOARDS.length;
    onChange(BOARDS[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div>
      <StepLabel n="1">which board do you have?</StepLabel>
      <div role="radiogroup" aria-label="Your board" className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
        {BOARDS.map((b, i) => {
          const on = b.id === value;
          return (
            <button
              key={b.id}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(b.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "vb-focus flex w-full items-start gap-3 rounded-xl p-3 text-left transition-shadow sm:p-3.5",
                on
                  ? "border-2 border-[#0a0a0a] bg-yellow-50 shadow-[3px_3px_0_#0a0a0a]"
                  : "border border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <BoardIcon id={b.id} size={40} className="mt-0.5 flex-none text-[#0a0a0a]" />
              <span className="block min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-gray-900">{b.short}</span>
                  {on && (
                    <span className="vb-mono text-[10.5px] font-bold uppercase tracking-[.8px] text-yellow-800">Selected</span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{b.hint}</span>
                <span className="mt-1.5 block text-[11.5px] text-gray-600">
                  file says <code className="vb-mono rounded bg-gray-100 px-1 text-gray-900">{b.token}</code>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] leading-normal text-muted-foreground">
        Not sure? Open <Code>your-bot.local/update</Code>. It tells you its board and the file it wants.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ latest

function InstallSteps({ fileName }: { fileName: string }) {
  return (
    <div className="mt-6">
      <StepLabel n="3">install it</StepLabel>
      <ol className="grid gap-2.5">
        {INSTALL_STEPS.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <NumBadge n={i + 1} size={24} />
            <span className="pt-0.5 text-[14.5px] leading-normal text-gray-700 [overflow-wrap:anywhere]">
              <Rich text={s} slots={{ ota: <Code>{fileName}</Code> }} />
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] leading-normal text-muted-foreground">
        The bot checks the name and refuses files for other boards.{" "}
        <VbLink href="/vizbot/guide#update" className={linkCls}>
          Full update guide
        </VbLink>
      </p>
    </div>
  );
}

function FileRule({ board }: { board: Board }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-[13px] leading-normal text-gray-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-yellow-800" aria-hidden="true" />
      <span>
        For a WiFi update, use this file: <b className="text-gray-900">{board.token}</b> in the name,{" "}
        <b className="text-gray-900">no -factory</b> on the end. Never upload a <Code>-factory.bin</Code> to the update
        page.
      </span>
    </div>
  );
}

function DownloadPanel({ release, board }: { release: VizbotRelease; board: Board }) {
  const ota = assetFor(release, board.id, "ota");
  if (!ota) {
    return (
      <div>
        <StepLabel n="2">download</StepLabel>
        <Callout kind="warn">
          There's no {board.short} file in {release.tag}.{" "}
          <a href={release.htmlUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
            See the release on GitHub
          </a>
          .
        </Callout>
        <InstallSteps fileName={otaFileName(board, versionOf(release))} />
      </div>
    );
  }
  return (
    <div>
      <StepLabel n="2">download</StepLabel>
      <a id="dl" href={ota.url} className="vb-btn vb-btn-primary vb-btn-big vb-focus" download>
        <Download className="h-5 w-5 flex-none" strokeWidth={2.2} aria-hidden="true" />
        <span>Download for {board.short}</span>
      </a>
      <div className="mt-2.5 flex items-center justify-between gap-2.5">
        <span className="vb-mono break-all text-[13px] text-gray-900">{ota.name}</span>
        <span className="flex-none text-[13px] text-muted-foreground">{formatSize(ota.size)}</span>
      </div>
      <FileRule board={board} />
      <InstallSteps fileName={ota.name} />
    </div>
  );
}

function ComingSoonPanel({ board }: { board: Board }) {
  return (
    <div>
      <StepLabel n="2">download</StepLabel>
      <div className="rounded-[10px] border border-dashed border-gray-300 bg-white px-4 py-5 text-center">
        <Clock className="mx-auto h-6 w-6 text-yellow-800" aria-hidden="true" />
        <p className="mt-2 font-slackey text-lg leading-tight">v{DOC_VERSION} isn't up yet.</p>
        <p className="mt-1.5 text-[14px] leading-normal text-muted-foreground">
          Check back soon. The file for your {board.short} will be{" "}
          <Code>{otaFileName(board, DOC_VERSION)}</Code>.
        </p>
      </div>
      <FileRule board={board} />
      <InstallSteps fileName={otaFileName(board, DOC_VERSION)} />
    </div>
  );
}

function LatestHead({ release }: { release: VizbotRelease | null }) {
  const title = release ? releaseTitle(release) : "Touch UI redesign";
  return (
    <div className="flex flex-col items-start gap-2.5 bg-[#0e1014] p-[18px] text-white md:flex-row md:items-center md:justify-between md:gap-4 md:px-[26px] md:py-5">
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="vb-mono rounded-full bg-[#FFD23F] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[1.2px] text-[#0a0a0a]">
          {release ? "latest" : "coming soon"}
        </span>
        <span className="font-slackey text-[28px] leading-none md:text-[32px]">v{release ? versionOf(release) : DOC_VERSION}</span>
        {title && <span className="text-[15px] text-gray-300 md:text-[17px]">{title}</span>}
      </div>
      {release && (
        <div className="vb-mono flex items-center gap-4 text-xs text-gray-400">
          <span>{formatDate(release.publishedAt)}</span>
          <a
            href={release.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-gray-300 no-underline hover:text-white"
          >
            GitHub <ExternalLink className="h-[13px] w-[13px]" />
          </a>
        </div>
      )}
    </div>
  );
}

function Latest({
  release,
  board,
  setBoard,
  state,
}: {
  release: VizbotRelease | null;
  board: Board;
  setBoard: (b: BoardId) => void;
  state: "loading" | "error" | "ready";
}) {
  let panel: React.ReactNode;
  if (state === "loading") {
    panel = (
      <div>
        <StepLabel n="2">download</StepLabel>
        <div className="h-[58px] animate-pulse rounded-[10px] bg-gray-200" />
        <p className="vb-mono mt-3 text-xs text-gray-400">checking GitHub for the latest release…</p>
      </div>
    );
  } else if (state === "error") {
    panel = (
      <div>
        <StepLabel n="2">download</StepLabel>
        <Callout kind="warn">
          Couldn't reach GitHub. The files are on{" "}
          <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
            the GitHub releases page
          </a>
          : pick <Code>{otaFileName(board, "X.Y.Z")}</Code>, never a <Code>-factory.bin</Code>.
        </Callout>
      </div>
    );
  } else {
    panel = release ? <DownloadPanel release={release} board={board} /> : <ComingSoonPanel board={board} />;
  }

  return (
    <section
      id="latest"
      className="mt-7 scroll-mt-24 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_12px_30px_-22px_rgba(0,0,0,.45)] md:mt-9"
    >
      <LatestHead release={state === "ready" ? release : null} />
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="px-4 py-[18px] md:px-[26px] md:py-6 lg:border-r lg:border-gray-200">
          <BoardPicker value={board.id} onChange={setBoard} />
        </div>
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-[18px] md:px-[26px] md:py-6 lg:border-t-0">{panel}</div>
      </div>
      {release && state === "ready" && (
        <div className="grid gap-6 border-t border-gray-200 px-4 py-[18px] md:px-[26px] md:py-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          <div className="min-w-0">
            {release.body.trim() ? (
              <Markdown>{release.body}</Markdown>
            ) : (
              <p className="text-sm text-muted-foreground">No release notes for this one.</p>
            )}
          </div>
          <div className="text-[13.5px] leading-relaxed text-muted-foreground">
            <p className="vb-mono mb-1.5 text-[11px] font-medium uppercase tracking-[1.3px] text-gray-600">also in this release</p>
            <p>
              A <Code>-factory.bin</Code> per board, for a first install over USB.{" "}
              <b className="text-gray-900">Not</b> for the update page.{" "}
              <a href="#usb" className={linkCls}>
                First install over USB
              </a>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ files

function FilesTable({ release, board }: { release: VizbotRelease; board: BoardId }) {
  const rows = BOARDS.map((b) => ({ b, ota: assetFor(release, b.id, "ota") }));
  const note = (
    <p className="border-t border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] leading-normal text-gray-600">
      <AlertTriangle className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
      The <Code>-factory.bin</Code> files are <b className="text-gray-900">USB first install only</b>. Don't use them
      on the update page. They're in{" "}
      <a href="#usb" className={linkCls}>
        First install over USB
      </a>
      .
    </p>
  );
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>all files in {versionOf(release)}</SectionHeading>
      <Lead>One update file per board.</Lead>
      {/* phones */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white md:hidden">
        {rows.map(({ b, ota }, i) => (
          <div key={b.id} className={cn("p-3.5", i && "border-t border-gray-200", b.id === board && "bg-yellow-50/60")}>
            <div className="mb-2 flex items-center gap-2.5">
              <BoardIcon id={b.id} size={28} />
              <span className="text-[15px] font-bold text-gray-900">{b.short}</span>
            </div>
            {ota ? (
              <a href={ota.url} className="flex justify-between gap-2 no-underline">
                <span className="vb-mono break-all text-xs text-blue-600">{ota.name}</span>
                <span className="flex-none text-xs text-muted-foreground">{formatSize(ota.size)}</span>
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">not in this release</span>
            )}
          </div>
        ))}
        {note}
      </div>
      {/* wider */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["board", "update over wifi", "size"].map((h) => (
                <th
                  key={h}
                  className="vb-mono border-b border-yellow-200 bg-yellow-50 px-3.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[1px] text-yellow-800"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, ota }, i) => (
              <tr key={b.id} className={cn(i && "border-t border-gray-200", b.id === board && "bg-yellow-50/60")}>
                <td className="px-3.5 py-3">
                  <span className="flex items-center gap-2.5">
                    <BoardIcon id={b.id} size={28} />
                    <span className="text-sm font-bold text-gray-900">{b.short}</span>
                  </span>
                </td>
                <td className="px-3.5 py-3">
                  {ota ? (
                    <a
                      href={ota.url}
                      className="vb-mono inline-flex items-center gap-1.5 text-[12.5px] text-blue-600 no-underline hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {ota.name}
                    </a>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">not in this release</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px] text-muted-foreground">{ota ? formatSize(ota.size) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {note}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ usb

function UsbDisclosure({ release, board }: { release: VizbotRelease | null; board: Board }) {
  const version = release ? versionOf(release) : DOC_VERSION;
  const factories = BOARDS.map((b) => ({ b, f: assetFor(release, b.id, "factory") }));
  const selected = assetFor(release, board.id, "factory");
  return (
    <section className="mt-5">
      <details id="usb" className="scroll-mt-24 rounded-xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer items-center gap-3 p-3.5 md:px-5 md:py-4">
          <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] bg-gray-100">
            <Usb className="h-[18px] w-[18px] text-gray-700" aria-hidden="true" />
          </span>
          <span className="block flex-1">
            <span className="block text-[15.5px] font-bold text-gray-900">First install over USB</span>
            <span className="block text-[13px] text-muted-foreground">
              For a board that's never run vizBot, or a clean start.
            </span>
          </span>
          <ChevronDown className="vb-chev h-[18px] w-[18px] flex-none text-gray-600" />
        </summary>
        <div className="px-3.5 pb-4 md:pb-5 md:pl-[66px] md:pr-5">
          <p className="mb-3.5 max-w-[70ch] text-[14.5px] leading-relaxed text-gray-700">
            Use the <Code>-factory.bin</Code>. It has the bootloader in it, so it goes on over USB,{" "}
            <b className="text-gray-900">not the update page</b>. It{" "}
            <b className="text-gray-900">wipes saved WiFi and settings</b>.
          </p>

          <div className="mb-4 overflow-hidden rounded-xl border border-amber-200">
            <p className="vb-mono flex items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[1px] text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              USB first install only. Not for the update page.
            </p>
            {release ? (
              factories.map(({ b, f }, i) => (
                <div
                  key={b.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3.5 py-2.5",
                    i && "border-t border-gray-200",
                    b.id === board.id && "bg-yellow-50/60",
                  )}
                >
                  <span className="text-sm font-medium text-gray-900">{b.short}</span>
                  {f ? (
                    <a href={f.url} className="vb-mono flex items-center gap-2 break-all text-xs text-gray-700 underline decoration-gray-300 underline-offset-2">
                      {f.name}
                      <span className="flex-none text-muted-foreground no-underline">{formatSize(f.size)}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">no factory file in {release.tag}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="px-3.5 py-3 text-sm text-muted-foreground">
                The factory files appear here once v{DOC_VERSION} is published.
              </p>
            )}
          </div>

          <ol className="grid gap-3">
            {USB_STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <NumBadge n={i + 1} size={24} />
                <span className="pt-px text-[14.5px] leading-relaxed text-gray-700">
                  <Rich text={s} />
                </span>
              </li>
            ))}
          </ol>
          <pre className="vb-mono mt-3.5 whitespace-pre-wrap break-all rounded-[10px] bg-[#0e1014] px-4 py-3.5 text-[11.5px] leading-relaxed text-gray-200 md:text-[13px]">
            <span className="text-gray-400"># or from a terminal</span>
            {"\n"}esptool.py --chip esp32s3 write_flash 0x0 {selected?.name ?? factoryFileName(board, version)}
          </pre>
        </div>
      </details>
    </section>
  );
}

// ------------------------------------------------------------------ older

function AssetRow({ a }: { a: VizbotAsset }) {
  const b = a.board ? BOARD_BY_ID[a.board] : null;
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-1">
      <a href={a.url} className="vb-mono break-all text-xs text-blue-600 underline-offset-2 hover:underline">
        {a.name}
      </a>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {b?.short}
        {a.kind === "factory" && <span className="font-medium text-amber-800">USB first install only</span>}
        <span>{formatSize(a.size)}</span>
      </span>
    </li>
  );
}

function Older({ releases }: { releases: VizbotRelease[] }) {
  const [showAll, setShowAll] = useState(false);
  if (!releases.length) return null;
  const shown = showAll ? releases : releases.slice(0, 3);
  const rest = releases.slice(3);
  const anyLegacy = releases.some(isLegacy);
  return (
    <section className="mt-12 md:mt-14">
      <SectionHeading>older releases</SectionHeading>
      <Lead>
        {anyLegacy && "The 2.x builds are from before the touch UI. "}
        You want the latest.
      </Lead>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {shown.map((r, i) => {
          const title = releaseTitle(r);
          return (
            <details key={r.tag} className={cn(i && "border-t border-gray-200")}>
              <summary className="flex cursor-pointer items-center gap-3 px-3.5 py-[13px] md:px-5 md:py-3.5">
                <ChevronRight className="vb-chev-r h-4 w-4 flex-none text-gray-600" />
                <span className="min-w-0 flex-1 text-[15px] font-medium text-gray-900">
                  {r.tag}
                  {title && <span className="font-normal text-gray-600"> – {title}</span>}
                  {isLegacy(r) && (
                    <span className="vb-mono ml-2 inline-block rounded border border-gray-200 bg-gray-100 px-1.5 text-[10.5px] uppercase tracking-[.6px] text-gray-600">
                      legacy 2.x
                    </span>
                  )}
                </span>
                <span className="vb-mono flex-none text-xs text-muted-foreground">{formatDate(r.publishedAt)}</span>
              </summary>
              <div className="px-3.5 pb-4 md:pl-12 md:pr-5">
                {r.body.trim() && <Markdown className="md-sm">{r.body}</Markdown>}
                {r.assets.length > 0 && (
                  <ul className="mt-3 border-t border-gray-100 pt-2">
                    {r.assets.map((a) => (
                      <AssetRow key={a.name} a={a} />
                    ))}
                  </ul>
                )}
                <a
                  href={r.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 no-underline hover:underline"
                >
                  On GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </details>
          );
        })}
        {!showAll && rest.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="vb-focus flex w-full items-center justify-center gap-1.5 border-t border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Show {rest.length} more ({rest[rest.length - 1].tag} – {rest[0].tag})
            <ChevronDown className="h-[15px] w-[15px]" />
          </button>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ page

export default function VizBotReleases() {
  const { data, isLoading, isError } = useVizbotReleases();
  const { latest, older } = splitReleases(data);
  const [boardId, setBoardId] = useState<BoardId>(initialBoard);
  const board = BOARD_BY_ID[boardId];
  const state = isLoading ? "loading" : isError && !data ? "error" : "ready";
  useHashScroll(state);

  // remember the choice (including one that arrived as ?board=), and keep
  // ?board= in the address bar so the page can be shared as-is
  useEffect(() => {
    saveBoard(boardId);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("board") === boardId) return;
      url.searchParams.set("board", boardId);
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }
  }, [boardId]);

  return (
    <>
      <SEO
        title="vizBot downloads"
        description="vizBot firmware for the Waveshare 1.69, Waveshare 1.3, M5Stack CoreS3 and Stackchan. Pick your board, grab one file, update over WiFi."
        image={SCREENS.home}
        keywords="vizBot, firmware, download, OTA, ESP32-S3, Stackchan, CoreS3, Waveshare"
      />
      <VizBotShell>
        <section>
          <Eyebrow>downloads · firmware</Eyebrow>
          <h1 className="mb-3 font-slackey text-[34px] font-normal leading-[1.08] md:text-[46px]">Fresh firmware.</h1>
          <p className="max-w-[56ch] text-base leading-relaxed text-gray-700 md:text-[17px]">
            Pick your board, grab one file, send it to your bot over WiFi. Settings stay put.
          </p>
        </section>

        <Latest release={latest} board={board} setBoard={setBoardId} state={state} />
        {latest && <FilesTable release={latest} board={boardId} />}
        <UsbDisclosure release={latest} board={board} />
        <Older releases={older} />

        <section className="mt-5">
          <p className="text-sm text-muted-foreground">
            New versions show up here as soon as they're on{" "}
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
              GitHub
            </a>
            .
          </p>
        </section>
      </VizBotShell>
    </>
  );
}
