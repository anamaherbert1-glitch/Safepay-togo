import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cyenoo",
    short_name: "Cyenoo",
    description: "Paiements sécurisés au Togo",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1F3A",
    theme_color: "#123A6B",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
