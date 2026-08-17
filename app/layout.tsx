import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
    <html lang="en" className="h-full">
      <body className="flex h-full flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
