import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const v = "20260914clean";
  return {
    name: "Cyenoo",
    short_name: "Cyenoo",
    description: "Paiements sécurisés au Togo",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#0032C7",
    theme_color: "#0032C7",
    orientation: "portrait",
    lang: "fr",
    icons: [
      { src: `/icon-192?v=${v}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icon-512?v=${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/icon?v=${v}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
