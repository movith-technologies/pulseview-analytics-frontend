// =============================================================================
// app/layout.tsx
// Kök Layout — Next.js App Router
//
// next/font/google ile Inter font sunucu tarafında yüklenir:
// - Performans: Font, build sırasında optimize edilerek self-hosted olarak
//   sunulur. Google Fonts'a hiç istek gitmez.
// - CLS (Cumulative Layout Shift): Font dosyası önceden indirilir, sayfa
//   düzeni kayması yaşanmaz.
// - CSS Variable: "--font-inter" tüm bileşenlerden erişilebilir.
// =============================================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// ---------------------------------------------------------------------------
// FONT TANIMI
// subsets: Yalnızca kullanılan karakter setleri indirilir (bant genişliği tasarrufu)
// variable: CSS custom property ismi — globals.css'de "var(--font-inter)" ile kullanılır
// display: "swap" — font yüklenene kadar sistem fontu gösterilir (flash of unstyled text önlenir)
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

// ---------------------------------------------------------------------------
// SEO Meta Verileri
// ---------------------------------------------------------------------------
import type { Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Pulseview SPC — Statistical Process Control",
  description:
    "Real-time industrial production monitoring and statistical process control dashboard. " +
    "Monitor camera and welding machine measurements with individual values, SPC X-bar charts, " +
    "pallet analysis, and multi-measurement comparison.",
  keywords: [
    "SPC", "statistical process control", "manufacturing", "quality control",
    "Highcharts", "production monitoring", "industrial IoT",
  ],
  authors: [{ name: "Pulseview" }],
  robots: "noindex, nofollow", // Internal tool — search engine excluded
};

// ---------------------------------------------------------------------------
// KOOT LAYOUT BİLEŞENİ
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`h-full ${inter.variable}`}>
      {/*
        inter.variable → <html> sınıfına "--font-inter" CSS custom property ekler.
        Bu sayede tüm alt bileşenler "var(--font-inter)" ile Inter fontuna erişir.
        globals.css'deki body { font-family: var(--font-inter), ... } bunu kullanır.
      */}
      <body className="flex h-full flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

