// Small shared bits for /admin/shows. Status colours: amber = to do,
// rose = not on site, zinc + eye = hidden, blue = unsaved.

import { EyeOff } from "lucide-react";
import { bandColor, isLive, isTodo, whyOff } from "./model";
import type { Night } from "./model";

export function Badges({ n, dirty, size = "sm" }: { n: Night; dirty?: boolean; size?: "xs" | "sm" }) {
  const cls = size === "xs" ? "text-[10px] px-1.5 py-px" : "text-[11px] px-1.5 py-0.5";
  const todo = n.clips.filter((c) => !(c.artist ?? "").trim()).length;
  return (
    <>
      {dirty && <span className={`${cls} whitespace-nowrap rounded-full bg-blue-500/15 font-medium text-blue-300 ring-1 ring-inset ring-blue-500/40`}>unsaved</span>}
      {isTodo(n) && <span className={`${cls} whitespace-nowrap rounded-full bg-amber-400/10 font-medium text-amber-300 ring-1 ring-inset ring-amber-400/40`}>to do {todo}</span>}
      {n.hidden ? (
        <span className={`${cls} inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-zinc-700/60 font-medium text-zinc-300 ring-1 ring-inset ring-zinc-600`}>
          <EyeOff className="h-3 w-3" />hidden
        </span>
      ) : !isLive(n) ? (
        <span title={whyOff(n)} className={`${cls} whitespace-nowrap rounded-full bg-rose-500/10 font-medium text-rose-300 ring-1 ring-inset ring-rose-500/40`}>not on site</span>
      ) : null}
    </>
  );
}

/** One cell per clip, coloured by band; hatched amber where nobody's named yet. */
export function MiniBar({ n, h = "h-1.5" }: { n: Night; h?: string }) {
  return (
    <div className={`flex w-full gap-px overflow-hidden rounded-full ${h}`}>
      {n.clips.map((c, i) => {
        const col = bandColor(n, (c.artist ?? "").trim());
        return col ? <span key={i} className="flex-1" style={{ background: col }} /> : <span key={i} className="hatch flex-1" />;
      })}
    </div>
  );
}
