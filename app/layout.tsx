import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// next/font/google — font dosyaları build sırasında indirilir,
// Google CDN'e harici istek atmaz. Performans + GDPR avantajı.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pulseview SPC — Statistical Process Control",
  description:
    "Real-time industrial production monitoring and statistical process control dashboard for camera and welding machine measurements.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex h-full flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
