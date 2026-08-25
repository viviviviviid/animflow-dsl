import type { Metadata } from "next";
import "./globals.css";
import "./connection.css";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/components/auth/AuthProvider";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AnimFlow Studio — Animated lecture authoring",
  description: "Turn Mermaid and AnimFlow source into deterministic animated lectures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${display.variable} ${mono.variable}`}>
      <body className="antialiased"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
