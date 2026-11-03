// The light ring, live: the radar's own effect code (ring.ts) with the same
// controls as its Light ring settings, two alert cards that show themselves,
// and the "Line it up" puzzle.

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { EMERGENCY_CODES, RING_DEFAULTS_NOTE } from "@/content/tinyradar";
import { cn } from "@/lib/utils";
import { AMBIENT_FX, FX_DESC, PALS, RADAR_FX, palCss, type Fx, type PalName } from "./ring";
import { RingDevice } from "./RingDevice";
import { useMedia, useMotion } from "./motion";
import { Crumb } from "./bits";

function Seg<T extends string | number>({
  opts,
  value,
  onPick,
  label,
  def,
}: {
  opts: { v: T; l: string }[];
  value: T;
  onPick: (v: T) => void;
  label: string;
  def?: T;
}) {
  return (
    <div className="rp-seg" role="group" aria-label={label}>
      {opts.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          aria-pressed={o.v === value}
          className={cn("vb-focus", o.v === def && "def")}
          onClick={() => onPick(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function MotionToggle() {
  const [motion, setMotion] = useMotion();
  return (
    <button type="button" className="rp-play vb-focus inline-flex items-center gap-1.5" onClick={() => setMotion(!motion)}>
      {motion ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
      {motion ? "Pause" : "Play"}
    </button>
  );
}

export function RingPlayground() {
  const narrow = useMedia("(max-width: 1023px)");
  const [fx, setFx] = useState<Fx>("Beam");
  const [pal, setPal] = useState<PalName>("Radar");
  const [bri, setBri] = useState(65);
  const [spd, setSpd] = useState(51);

  return (
    <div className="rp">
      <div className="rp-dev">
        <div className="rp-now" aria-live="polite">
          {fx}
          <small>{FX_DESC[fx]}</small>
        </div>
        <RingDevice size={narrow ? 190 : 240} ring={{ fx, pal, bri: bri / 100, spd: spd * 2.55 }} />
        <MotionToggle />
      </div>
      <div className="rp-ctl">
        <div className="rp-grp">
          <span className="rp-lbl">Radar · follows the sweep and planes</span>
          <Seg label="Radar effects" opts={RADAR_FX.map((v) => ({ v, l: v }))} value={fx} onPick={setFx} />
        </div>
        <div className="rp-grp">
          <span className="rp-lbl">Ambient · just a nice glow</span>
          <Seg label="Ambient effects" opts={AMBIENT_FX.map((v) => ({ v, l: v }))} value={fx} onPick={setFx} def="Breathe" />
        </div>
        <div className="rp-grp">
          <span className="rp-lbl">Colours · 9 sets, or up to 4 of your own</span>
          <div className="rp-pals" role="group" aria-label="Colour sets">
            {Object.keys(PALS).map((n) => (
              <button key={n} type="button" className="vb-focus" aria-pressed={n === pal} onClick={() => setPal(n)}>
                <i style={{ background: `conic-gradient(${palCss(n)})` }} aria-hidden="true" />
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="rp-grp">
          <span className="rp-lbl">Brightness and speed</span>
          <label className="rp-sl">
            Brightness
            <input type="range" min={5} max={100} value={bri} onChange={(e) => setBri(+e.target.value)} />
            <output>{bri}%</output>
          </label>
          <label className="rp-sl">
            Speed
            <input type="range" min={0} max={100} value={spd} onChange={(e) => setSpd(+e.target.value)} />
            <output>{spd}%</output>
          </label>
        </div>
        <p className="rp-where m-0">
          On your radar: <Crumb path={["Settings", "Light ring"]} />. {RING_DEFAULTS_NOTE}
        </p>
      </div>
    </div>
  );
}

export function AlertCards() {
  const [em, setEm] = useState(true);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="tr-card">
        <div className="tr-dark rp-alert-top">
          <RingDevice size={96} bare sky={{ emergency: em }} ring={{ fx: "Planes", alerts: 2 }} label="A small radar whose ring flashes red while a plane squawks an emergency" />
          <div className="t">
            {em ? "A plane squawks 7700." : "All quiet."}
            <br />
            <button type="button" className="rp-tbtn vb-focus" onClick={() => setEm(!em)}>
              {em ? "Stop the emergency" : "Squawk 7700"}
            </button>
          </div>
        </div>
        <div className="px-4 py-3.5">
          <h4 className="m-0 mb-1 flex items-center gap-2 text-[16px] font-bold">
            Emergencies <span className="rp-pill on">ON by default</span>
          </h4>
          <p className="m-0 text-[14.5px] leading-relaxed text-gray-700">
            The ring flashes red, over any effect, when a plane signals an emergency.
          </p>
          <div className="rp-sq">
            {EMERGENCY_CODES.map((c) => (
              <span key={c.code}>
                {c.code} {c.what}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="tr-card">
        <div className="tr-dark rp-alert-top">
          <RingDevice size={96} bare sky={{ close: true }} ring={{ fx: "Planes", alerts: 3 }} label="A small radar whose ring pulses while a plane is inside the first ring" />
          <div className="t">A plane inside the first ring.</div>
        </div>
        <div className="px-4 py-3.5">
          <h4 className="m-0 mb-1 flex items-center gap-2 text-[16px] font-bold">
            Close planes <span className="rp-pill off">OFF by default</span>
          </h4>
          <p className="m-0 text-[14.5px] leading-relaxed text-gray-700">
            The ring pulses once a second, in that plane's height colour, while it's inside the first ring.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Where LED 0 sits on the demo radar: 90° round, so 270° lines it up. */
const PHYS = 2;

export function LineItUp() {
  const narrow = useMedia("(max-width: 1023px)");
  const [rot, setRot] = useState(0);
  const [ccw, setCcw] = useState(0);
  const ok = (8 - rot) % 8 === PHYS && !ccw;
  return (
    <div className="tr-card">
      <div className="rp-align">
        <div className="tr-dark grid place-items-center rounded-2xl p-3">
          <RingDevice size={narrow ? 160 : 180} phys={PHYS} ring={{ fx: "Beam", bri: 0.8, rot, ccw }} label="A radar running Beam, its ring turned by the buttons beside it" />
        </div>
        <div className="w-full">
          <p className="m-0 mb-1.5 text-[15px] text-gray-700">
            Try it: this radar's ring is in crooked. Turn it until the light rides with the sweep.
          </p>
          <div className="rp-grp mb-2 mt-2.5">
            <span className="rp-lbl">Turn the ring</span>
            <Seg label="Turn the ring" opts={[0, 1, 2, 3, 4, 5, 6, 7].map((v) => ({ v, l: `${v * 45}°` }))} value={rot} onPick={setRot} />
          </div>
          <div className="rp-grp mb-0">
            <span className="rp-lbl">Direction</span>
            <Seg
              label="Direction"
              opts={[
                { v: 0, l: "Clockwise" },
                { v: 1, l: "Anticlockwise" },
              ]}
              value={ccw}
              onPick={setCcw}
            />
          </div>
          <span className={cn("rp-ok", ok ? "y" : "n")} role="status">
            {ok ? "Lined up: the light follows the sweep" : "Not yet: the light doesn't follow the sweep"}
          </span>
        </div>
      </div>
    </div>
  );
}
