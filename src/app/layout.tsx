import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nutritrackpro.vercel.app"),
  title: {
    default: "NutriTrack Pro",
    template: "%s | NutriTrack Pro",
  },
  description:
    "Plataforma profesional de seguimiento nutricional. Monitorea comidas, progreso y mejora la comunicación entre nutricionistas y pacientes.",
  keywords: [
    "nutrición",
    "seguimiento nutricional",
    "dietista",
    "pacientes",
    "salud",
    "bienestar",
    "app de nutrición",
  ],
  authors: [{ name: "NutriTrack Team" }],
  creator: "NutriTrack",
  publisher: "NutriTrack",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://nutritrackpro.vercel.app",
    title: "NutriTrack Pro",
    description:
      "Plataforma profesional de seguimiento nutricional. Monitorea comidas, progreso y mejora la comunicación entre nutricionistas y pacientes.",
    siteName: "NutriTrack Pro",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NutriTrack Pro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriTrack Pro",
    description:
      "Plataforma profesional de seguimiento nutricional. Monitorea comidas, progreso y mejora la comunicación entre nutricionistas y pacientes.",
    images: ["/og-image.jpg"],
    creator: "@nutritrack",
  },
  icons: {
    icon: [{ url: "/icon.svg?v=2", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
