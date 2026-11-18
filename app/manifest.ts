import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Summit — The Nine Summits",
    short_name: "Summit",
    description: "A daily check-in expedition.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3f8",
    theme_color: "#f5f3f8",
    icons: [
      { src: "/summit/summit-mark-192.png", sizes: "192x192", type: "image/png" },
      { src: "/summit/summit-mark-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
