import L from "leaflet";

// Define available marker colors
export type MarkerColor =
  | "blue"
  | "gold"
  | "red"
  | "green"
  | "orange"
  | "yellow"
  | "violet"
  | "grey"
  | "black";

// Define an object type for icons
type MarkerIconsType = Record<MarkerColor, L.Icon>;

const markerIcons: MarkerIconsType = {
  blue: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-blue.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  gold: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-gold.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  red: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-red.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  green: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-green.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  orange: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-orange.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  yellow: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-yellow.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  violet: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-violet.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  grey: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-grey.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  black: new L.Icon({
    iconUrl: "/markers/marker-icon-2x-black.png",
    shadowUrl: "/markers/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

export default markerIcons;
