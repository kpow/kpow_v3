// A phone, drawn in CSS, showing one setup screen: the phone's Wi-Fi list, the
// radar's setup page (styled like the firmware's own portal page,
// src/services/wifi_setup.cpp), "Saved!", or a real screenshot (`src`).
// Generic names only: "Your home Wi-Fi", "Neighbour".

import { HOST, HOTSPOT } from "@/content/tinyradar";
import { cn } from "@/lib/utils";

export type PhoneKind = "wifi" | "portal" | "saved" | "browser" | "location";

function Sig({ n }: { n: number }) {
  return (
    <span className="pm-sig" aria-hidden="true">
      {[5, 8, 11].map((h, i) => (
        <i key={i} style={{ height: h, opacity: i < n ? 1 : 0.25 }} />
      ))}
    </span>
  );
}

function Bar() {
  return (
    <div className="pm-sb" aria-hidden="true">
      <span>9:41</span>
      <Sig n={3} />
    </div>
  );
}

function Screen({ kind }: { kind: PhoneKind }) {
  switch (kind) {
    case "wifi":
      return (
        <div className="pm-scr pm-wl">
          <Bar />
          <div className="pm-back">‹ Settings</div>
          <h4>Wi-Fi</h4>
          <div className="pm-grp">
            <div className="pm-r">
              <b>Wi-Fi</b>
              <span className="pm-sw" />
            </div>
          </div>
          <div className="pm-cap">Networks</div>
          <div className="pm-grp">
            <div className="pm-r hit">
              <span>{HOTSPOT}</span>
              <Sig n={3} />
            </div>
            <div className="pm-r">
              <span>Your home Wi-Fi</span>
              <Sig n={3} />
            </div>
            <div className="pm-r">
              <span>Neighbour</span>
              <Sig n={1} />
            </div>
          </div>
        </div>
      );
    case "portal":
      return (
        <div className="pm-scr dark">
          <Bar />
          <div className="pm-portal">
            <h1>
              tiny<b>radar</b>
            </h1>
            <p className="lead">
              Pick your home Wi-Fi and type its password. <b>Your radar needs a 2.4 GHz network</b> — 5 GHz-only networks
              won't show up.
            </p>
            <div className="net on">
              <span>Your home Wi-Fi</span>
              <Sig n={3} />
            </div>
            <div className="net">
              <span>Neighbour</span>
              <Sig n={1} />
            </div>
            <label>Wi-Fi network</label>
            <div className="in">Your home Wi-Fi</div>
            <label>Wi-Fi password</label>
            <div className="in f">••••••••••</div>
            <div className="btn">Connect my radar</div>
            <div className="btn o">Look for networks again</div>
          </div>
        </div>
      );
    case "saved":
      return (
        <div className="pm-scr dark">
          <Bar />
          <div className="pm-portal">
            <h1>
              tiny<b>radar</b>
            </h1>
            <div className="msg">
              <span className="big">Saved!</span>
              Your radar is joining your Wi-Fi now, and this setup network will disappear.
              <br />
              <br />
              In about a minute the radar's screen shows its web address. On a phone or laptop on your home Wi-Fi, open:
              <span className="addr">{HOST}</span>
            </div>
          </div>
        </div>
      );
    case "location":
      return (
        <div className="pm-scr dark">
          <Bar />
          <div className="pm-loc">
            <h1>Where is your radar?</h1>
            <p className="lede">We show planes around this spot. You can change it any time.</p>
            <div className="lbl">Find your town</div>
            <div className="in">
              <span>Town, city or ZIP</span>
              <b>Search</b>
            </div>
            <div className="lbl">or drag the map</div>
            <div className="map">
              <svg viewBox="0 0 200 130" aria-hidden="true">
                <rect width="200" height="130" fill="#f2efe9" />
                <path d="M0 92 C60 80 85 120 130 108 S180 118 200 126" stroke="#aad3df" strokeWidth="8" fill="none" />
                <ellipse cx="150" cy="34" rx="34" ry="18" fill="#aad3df" transform="rotate(-20 150 34)" />
                <path d="M0 40 L200 74" stroke="#f9d38a" strokeWidth="4" />
                <path d="M74 0 L86 130 M20 128 L118 52" stroke="#fff" strokeWidth="4" />
                <rect x="18" y="8" width="38" height="26" rx="4" fill="#d9e8c8" />
                <circle cx="100" cy="64" r="11" fill="none" stroke="#7C4DFF" strokeWidth="2" />
                <circle cx="100" cy="64" r="2.5" fill="#7C4DFF" />
              </svg>
            </div>
            <div className="lbl">Distances in</div>
            <div className="seg">
              <span className="on">Miles</span>
              <span>Kilometres</span>
            </div>
            <div className="go">Use this spot</div>
          </div>
        </div>
      );
    case "browser":
      return (
        <div className="pm-scr">
          <Bar />
          <div className="pm-url">
            <span>Open in your browser</span>
            <b>{HOST}</b>
            <small>on your home Wi-Fi</small>
          </div>
        </div>
      );
  }
}

const LABEL: Record<PhoneKind, string> = {
  wifi: `A phone's Wi-Fi settings, with ${HOTSPOT} at the top of the list`,
  portal: "The radar's setup page on a phone: pick your home Wi-Fi, type the password, Connect my radar",
  saved: "The setup page says Saved! and shows the address tinyradar.local",
  browser: "A browser with tinyradar.local typed in",
  location: "The radar's page asking Where is your radar?: find your town, or drag the map, then Use this spot",
};

/** `width` is the phone's outer width in px. `src` swaps the drawing for a real screenshot. */
export function PhoneMock({
  kind,
  src,
  alt,
  width = 200,
  className,
}: {
  kind: PhoneKind;
  src?: string | null;
  alt?: string;
  width?: number;
  className?: string;
}) {
  const k = width / 200;
  return (
    <div
      className={cn("pm-box", className)}
      style={{ width, height: Math.round(width * (19 / 9)) }}
      role="img"
      aria-label={alt ?? LABEL[kind]}
    >
      <div className="pm" style={{ transform: k === 1 ? undefined : `scale(${k})` }}>
        {src ? (
          <div className="pm-scr dark">
            <img src={src} alt="" loading="lazy" />
          </div>
        ) : (
          <Screen kind={kind} />
        )}
      </div>
    </div>
  );
}
