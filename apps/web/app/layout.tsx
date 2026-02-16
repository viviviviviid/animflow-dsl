import type { Metadata } from "next";
import "./globals.css";
import { Comic_Neue } from "next/font/google";

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-comic-neue",
});

export const metadata: Metadata = {
  title: "AnimDiagram - 애니메이션 다이어그램 에디터",
  description: "Mermaid 기반 애니메이션 다이어그램 DSL 렌더링 엔진",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={comicNeue.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
