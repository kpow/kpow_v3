// "Which file?" helpers. The bot's update page takes any file whose name
// contains its BOARD_TYPE token (vizbot/ota_update.h), and a -factory.bin
// passes that check too, so the pages spell the rule out wherever a file is
// offered: update over WiFi = vizbot-<board>-v<version>.bin, never -factory.

import { CircleX } from "lucide-react";
import { BOARDS, BOARD_BY_ID, factoryFileName, type BoardId } from "@/content/vizbot";
import { cn } from "@/lib/utils";
import { Code, Stage } from "./bits";

function Seg({ text, label, hl }: { text: string; label?: string; hl?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "vb-mono rounded-[5px] px-1 py-[3px] text-sm font-medium md:text-[17px]",
          hl ? "bg-[#FFD23F] text-[#0a0a0a]" : "text-gray-200",
        )}
      >
        {text}
      </span>
      <span className={cn("vb-mono h-3 text-[10.5px] uppercase tracking-[.8px]", hl ? "text-yellow-200" : "text-gray-400")}>
        {label}
      </span>
    </span>
  );
}

/** The file name, split into its parts, on the dark stage. */
export function FilenameAnatomy({ board = "lcd169", version }: { board?: BoardId; version: string }) {
  const b = BOARD_BY_ID[board];
  return (
    <Stage className="p-5 md:px-[26px] md:py-6">
      <p className="vb-mono mb-3.5 text-[11px] uppercase tracking-[1.4px] text-gray-400">the file for a wifi update</p>
      <div className="flex flex-wrap items-start">
        <Seg text="vizbot-" />
        <Seg text={b.token} label="board" hl />
        <Seg text={`-v${version}`} label="version" />
        <Seg text=".bin" />
      </div>
      <p className="mt-4 text-[13.5px] leading-relaxed text-gray-300">
        The update page only takes a file whose name contains its own board. Anything else is refused with “Wrong
        board type” and nothing changes.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
        <CircleX className="mt-0.5 h-4 w-4 flex-none text-red-400" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-gray-300">
          <span className="vb-mono text-gray-400 line-through decoration-red-400/70 [overflow-wrap:anywhere]">
            {factoryFileName(b, version)}
          </span>
          <br />
          <b className="text-white">Never the -factory.bin.</b> It has your board's name in it too, but it's for a
          first install over USB only.
        </p>
      </div>
    </Stage>
  );
}

/** Board → the token to look for in the file name. */
export function TokenList({ className, highlight }: { className?: string; highlight?: BoardId }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
      <p className="vb-mono border-b border-yellow-200 bg-yellow-50 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[1px] text-yellow-800">
        look for your board in the name
      </p>
      {BOARDS.map((b, i) => (
        <div
          key={b.id}
          className={cn(
            "flex items-center justify-between gap-3 px-3.5 py-2 text-sm",
            i && "border-t border-gray-200",
            highlight === b.id && "bg-yellow-50/60",
          )}
        >
          <span className="font-medium text-gray-900">{b.short}</span>
          <Code>{b.token}</Code>
        </div>
      ))}
    </div>
  );
}
