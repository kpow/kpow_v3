import * as L from "leaflet";

declare module "leaflet" {
  namespace AwesomeMarkers {
    interface AwesomeMarkersIconOptions {
      icon?: string;
      prefix?: string;
      markerColor?: string;
      iconColor?: string;
      extraClasses?: string;
      number?: string | number;
      spin?: boolean;
    }

    function icon(options: AwesomeMarkersIconOptions): L.Icon;
  }
}

declare module "leaflet.awesome-markers";
