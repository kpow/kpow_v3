// The seven looks as scope colours, from the content file's LOOKS swatches.
// Day and Dusk get the made-up map and colour planes by height, like the radar.

import { LOOKS } from "@/content/tinyradar";
import type { Look } from "./ring";

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)).join(",");

export function lookOf(name: string): Look {
  const l = LOOKS.find((x) => x.name === name) ?? LOOKS[3];
  const day = l.name === "Day";
  const map = l.water
    ? { land: l.bg, water: l.water, road: day ? "rgba(255,255,255,.85)" : "rgba(120,140,150,.35)" }
    : undefined;
  return {
    bg: l.bg,
    ring: l.ring,
    sweep: day ? rgb("#2E7D52") : rgb(l.plane === "#ffffff" ? "#1DFF86" : l.plane),
    ink: day ? "#1d2b22" : "#EAFFF3",
    plane: l.water ? null : l.plane,
    map,
  };
}
