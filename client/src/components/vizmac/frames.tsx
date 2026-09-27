// The vizMac controller in its printed case, around a real 2x screen mock and its
// 16×8 LED strip. Size it with --sw, the screen's on-page width, e.g.
// className="[--sw:132px] md:[--sw:150px]" (the same pattern as vizBot's frames).

import { shot } from "@/content/vizmac";
import { cn } from "@/lib/utils";
import { SkullGlyph } from "./icons";

export function ControllerFrame({
  screen,
  leds,
  alt,
  className,
  eager = false,
}: {
  /** Screen mock id, e.g. "m-keys-main" */
  screen: string;
  /** LED strip id, e.g. "m-keys-main-leds" */
  leds: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const loading = eager ? "eager" : "lazy";
  return (
    <div className={cn("vm-ctl", className)}>
      <SkullGlyph className="vm-ctl-skull" strokeWidth={2.2} />
      <span className="vm-ctl-leds">
        <img src={shot(leds)} alt="" width={480} height={248} loading={loading} decoding="async" />
      </span>
      <div className="vm-ctl-bezel">
        <img src={shot(screen)} alt={alt} width={240} height={320} loading={loading} decoding="async" className="vb-shot" />
      </div>
      <div className="vm-ctl-controls" aria-hidden="true">
        <span className="vm-ctl-ko" />
        <span className="vm-ctl-knob" />
      </div>
    </div>
  );
}
