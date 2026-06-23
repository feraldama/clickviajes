import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Calistoga, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const calistoga = Calistoga({ subsets: ["latin"], weight: "400", variable: "--font-calistoga", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Click Viajes",
  description: "Sistema de gestión para agencias de viajes y turismo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${calistoga.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
