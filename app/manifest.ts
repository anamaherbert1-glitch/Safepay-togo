import type { MetadataRoute } from "next";
import { ICON_VERSION } from "@/lib/cyenoo-icon-data";

export default function manifest(): MetadataRoute.Manifest {
  const v = ICON_VERSION;
  return {
    name: "Cyenoo",
    short_name: "Cyenoo",
    description: "Paiements sécurisés au Togo",
    start_url: "/",
    display: "standalone",
    background_color: "#0032C7",
    theme_color: "#0032C7",
    orientation: "portrait",
    icons: [
      { src: `/icon?v=${v}`, sizes: "180x180", type: "image/png", purpose: "any" },
      { src: `/icon?v=${v}`, sizes: "180x180", type: "image/png", purpose: "maskable" },
      { src: `/apple-icon?v=${v}`, sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
