import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriTrack Pro",
    short_name: "NutriTrack",
    description: "Plataforma profesional de seguimiento nutricional",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg?v=2",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
