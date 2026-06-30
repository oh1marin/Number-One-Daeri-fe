import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#2563eb",
    lang: "ko",
    icons: [
      { src: "/images/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
