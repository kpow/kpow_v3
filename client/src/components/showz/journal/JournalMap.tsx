// The sticky map beside the journal. Every venue is a grey dot; the year you're
// scrolling through gets blue dots and a dashed route in date order, and the
// night in view pulses. Plain Leaflet (not react-leaflet) because it is driven
// imperatively by scroll position.

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HOME, plural } from "@/lib/showz-stats";
import type { Night, ShowStats } from "@/lib/showz-stats";

interface Props {
  stats: ShowStats;
  shown: Night[];
  year: number | null;
  active: Night | null;
  /** clicking a venue dot jumps the journal to its first night that year */
  onVenue: (n: Night) => void;
  zoomTo: { n: Night; at: number } | null;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function JournalMap({ stats, shown, year, active, onVenue, zoomTo }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>();
  const yearLayer = useRef<L.LayerGroup>();
  const activeLayer = useRef<L.LayerGroup>();
  const justFlew = useRef(false); // a new year just flew the map; don't also pan
  const onVenueRef = useRef(onVenue);
  onVenueRef.current = onVenue;

  useEffect(() => {
    const m = L.map(el.current!, { scrollWheelZoom: false, zoomControl: false }).setView([HOME.lat, HOME.lon], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(m);
    L.control.zoom({ position: "topright" }).addTo(m);
    const base = L.layerGroup().addTo(m);
    stats.venues.forEach((v) =>
      L.circleMarker([v.lat, v.lon], { radius: 3, color: "#a3a3a3", weight: 1, fillColor: "#d4d4d4", fillOpacity: 0.9, interactive: false }).addTo(base),
    );
    yearLayer.current = L.layerGroup().addTo(m);
    activeLayer.current = L.layerGroup().addTo(m);
    map.current = m;
    // the box can change size (sticky, mobile hide/show); keep tiles filling it
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current!);
    return () => {
      ro.disconnect();
      m.remove();
    };
  }, [stats]);

  // the year's venues + route
  useEffect(() => {
    const m = map.current, layer = yearLayer.current;
    if (!m || !layer) return;
    layer.clearLayers();
    const ns = shown.filter((n) => n.year === year && n.lat != null && n.lon != null);
    if (!ns.length) return;
    const pts = ns.map((n) => [n.lat!, n.lon!] as [number, number]);
    L.polyline(pts, { color: "#2563eb", weight: 2, opacity: 0.6, dashArray: "4 6" }).addTo(layer);
    const count = new Map<string, number>();
    ns.forEach((n) => count.set(n.venueKey, (count.get(n.venueKey) ?? 0) + 1));
    count.forEach((c, k) => {
      const v = stats.venueByKey[k];
      if (!v) return;
      L.circleMarker([v.lat, v.lon], { radius: 5 + Math.sqrt(c) * 3, color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 0.85 })
        .bindTooltip(`<b>${esc(v.name)}</b><br>${plural(c, "night")} in ${year}`, { direction: "top" })
        .on("click", () => onVenueRef.current(ns.find((n) => n.venueKey === k)!))
        .addTo(layer);
    });
    justFlew.current = true;
    const b = L.latLngBounds(pts);
    if (pts.length === 1 || b.getNorthEast().distanceTo(b.getSouthWest()) < 2000) m.flyTo(pts[0], 12, { duration: 0.8 });
    else m.flyToBounds(b, { padding: [28, 28], maxZoom: 12, duration: 0.8 });
  }, [stats, shown, year]);

  // the night in view
  useEffect(() => {
    const m = map.current, layer = activeLayer.current;
    if (!m || !layer) return;
    layer.clearLayers();
    if (!active || active.lat == null || active.lon == null) return;
    const at: [number, number] = [active.lat, active.lon];
    L.circleMarker(at, { radius: 10, color: "#111827", weight: 2, fill: false, className: "ks-ping", interactive: false }).addTo(layer);
    L.circleMarker(at, { radius: 7, color: "#fff", weight: 2, fillColor: "#111827", fillOpacity: 1, interactive: false }).addTo(layer);
    if (justFlew.current) justFlew.current = false;
    else if (!m.getBounds().pad(-0.1).contains(at)) m.panTo(at, { animate: true });
  }, [active]);

  useEffect(() => {
    if (zoomTo && zoomTo.n.lat != null && zoomTo.n.lon != null) map.current?.flyTo([zoomTo.n.lat, zoomTo.n.lon], 15, { duration: 0.8 });
  }, [zoomTo]);

  return <div ref={el} className="isolate h-40 w-full overflow-hidden rounded-lg border border-neutral-200 lg:h-[400px]" />;
}
