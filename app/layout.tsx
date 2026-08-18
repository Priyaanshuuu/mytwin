import type { Metadata } from "next";
import React from "react";
import { Geist, Geist_Mono, Alfa_Slab_One } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  variable: "--font-alfa-slab",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Twin",
  description: "Voice based Twin!!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${alfaSlabOne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
