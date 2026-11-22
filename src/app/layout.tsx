import type { Metadata } from "next";
import { Baloo_Thambi_2, Geist_Mono, Mukta_Malar } from "next/font/google";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${mukta.variable} ${baloo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
