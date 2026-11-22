import type { Metadata } from "next";
import { Baloo_Thambi_2, Geist_Mono, Mukta_Malar } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

import "./globals.css";

// Thème « Kolam » : les deux polices couvrent le latin et le tamoul.
const mukta = Mukta_Malar({
  variable: "--font-mukta-malar",
  subsets: ["latin", "tamil"],
  weight: ["400", "600", "700"],
});

const baloo = Baloo_Thambi_2({
  variable: "--font-baloo-thambi",
  subsets: ["latin", "tamil"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tamil du jour",
  description: "Un mot tamoul par jour, pour les enfants.",
  applicationName: "Tamil du jour",
  // Fichier statique : ses couleurs reprennent les tokens du thème (vérifié
  // par src/test/pwa-manifest.test.ts).
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Tamil du jour",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${mukta.variable} ${baloo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
