// The round screen's own status screens, recreated from the radar repo's
// src/ui/status_screens.cpp (the words are the firmware's). They sit inside a
// RingDevice (which sets --s, the screen size) or alone via <RoundScreen>.
// Examples use 192.168.1.40, never a real address.

import type { ReactNode } from "react";
import { HOST, HOTSPOT, HOTSPOT_IP, SAMPLE_IP } from "@/content/tinyradar";
import { cn } from "@/lib/utils";

export type ScreenKind =
  | "boot"
  | "setup"
  | "connecting"
  | "failed"
  | "location"
  | "online"
  | "nolocation"
  | "updating"
  | "updated"
  | "updatefail"
  | "factory"
  | "address"
  | "off";

function Spinner() {
  return (
    <div className="rs-spinwrap" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => {
        const a = ((-90 - i * 36) * Math.PI) / 180;
        return (
          <i
            key={i}
            style={{ left: `${50 + 41 * Math.cos(a)}%`, top: `${50 + 41 * Math.sin(a)}%`, opacity: 1 - i * 0.086 }}
          />
        );
      })}
    </div>
  );
}

function Address({ title }: { title: string }) {
  return (
    <div className="rs k ring">
      <div>
        <div className="e">{title}</div>
        <div className="n sm">
          On your phone or laptop
          <br />
          open
        </div>
        <div className="e">{HOST}</div>
        <div className="n">or {SAMPLE_IP}</div>
      </div>
    </div>
  );
}

export function screenBody(k: ScreenKind): ReactNode {
  switch (k) {
    case "boot":
      return (
        <div className="rs boot">
          <span className="font-slackey">
            tiny<b>radar</b>
          </span>
        </div>
      );
    case "setup":
      return (
        <div className="rs y">
          <div>
            <div className="t">Wi-Fi setup</div>
            <div className="n">1. Join network:</div>
            <div className="e">{HOTSPOT}</div>
            <div className="n">2. Open in browser:</div>
            <div className="e">{HOST}</div>
            <div className="n">or {HOTSPOT_IP}</div>
          </div>
        </div>
      );
    case "failed":
      return (
        <div className="rs y">
          <div>
            <div className="t">Could not connect</div>
            <div className="n">
              Unplug the radar,
              <br />
              plug it back in, then
              <br />
              join {HOTSPOT}
              <br />
              to pick Wi-Fi again
            </div>
          </div>
        </div>
      );
    case "connecting":
      return (
        <div className="rs k">
          <Spinner />
          <div className="n b">
            Connecting to
            <br />
            Your Wi-Fi
          </div>
        </div>
      );
    case "location":
      return <Address title="Set your location" />;
    case "online":
    case "address":
      return <Address title="Radar is online" />;
    case "nolocation":
      return (
        <div className="rs clear">
          <div className="rs-card">
            <div className="e">Set your location</div>
            <div className="n sm">{HOST}</div>
          </div>
        </div>
      );
    case "updating":
      return (
        <div className="rs k upd">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1F3A2B" strokeWidth="5" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#1DFF86"
              strokeWidth="5"
              strokeDasharray={`${0.62 * 276.5} 276.5`}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <div className="n">Updating</div>
            <div className="big">62%</div>
            <div className="n">Don't unplug</div>
          </div>
        </div>
      );
    case "updated":
      return (
        <div className="rs k">
          <div>
            <div className="t g">Updated</div>
            <div className="n">Restarting...</div>
          </div>
        </div>
      );
    case "updatefail":
      return (
        <div className="rs k">
          <div>
            <div className="t">Update failed</div>
            <div className="n">
              Still on the old
              <br />
              version - all OK.
            </div>
          </div>
        </div>
      );
    case "factory":
      return (
        <div className="rs y">
          <div>
            <div className="t">Factory reset</div>
            <div className="n">Restarting...</div>
          </div>
        </div>
      );
    case "off":
      return <div className="rs off" />;
  }
}

/** Just the round screen, no cabinet: for keys and strips. */
export function RoundScreen({ kind, size = 64, className }: { kind: ScreenKind; size?: number; className?: string }) {
  return (
    <span
      className={cn("trd-solo", className)}
      style={{ ["--s" as string]: `${size}px` }}
      role="img"
      aria-label={`The round screen: ${SCREEN_LABEL[kind]}`}
    >
      {screenBody(kind)}
    </span>
  );
}

export const SCREEN_LABEL: Record<ScreenKind, string> = {
  boot: "the tinyradar wordmark",
  setup: `yellow, "Wi-Fi setup", join ${HOTSPOT}, open ${HOST}`,
  connecting: '"Connecting to" your Wi-Fi, with a spinner',
  failed: 'yellow, "Could not connect"',
  location: `"Set your location", open ${HOST}`,
  online: `"Radar is online", open ${HOST}`,
  address: `"Radar is online", open ${HOST}`,
  nolocation: 'rings and a sweep, no planes, a "Set your location" card',
  updating: '"Updating", a ring filling up, "Don\'t unplug"',
  updated: '"Updated", "Restarting..."',
  updatefail: '"Update failed", "Still on the old version - all OK."',
  factory: '"Factory reset", "Restarting..."',
  off: "off",
};
