import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "@/components/sound/SoundProvider";
import { BootOverlay } from "@/components/fx/BootOverlay";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
import { LiveSync } from "@/components/shell/LiveSync";
import { getDataMode } from "@/lib/data";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weft · Terminal financier",
  description: "P&L réel des marchés — CA, spend, gain net, ROAS.",
};

export const viewport: Viewport = {
  themeColor: "#070a08",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mode = getDataMode();
  return (
    <html lang="fr" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SoundProvider>
          <BootOverlay />
          {mode === "live" && <LiveSync />}
          <Header mode={mode} />
          {/* pb calé sur la hauteur de BottomNav (fixed, hors du flux) + zone
              sûre iOS, pour que le bas du contenu ne se cache jamais dessous. */}
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 lg:max-w-6xl lg:px-8 lg:pt-6">
            {children}
          </main>
          <BottomNav />
        </SoundProvider>
      </body>
    </html>
  );
}
