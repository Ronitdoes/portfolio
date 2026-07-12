import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import TransitionProvider from "@/components/TransitionProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const absans = localFont({
  src: "../public/fonts/Absans-Regular.woff2",
  variable: "--font-absans",
});

export const metadata: Metadata = {
  title: "Ronit Mahajan | Portfolio",
  description: "Ronit Mahajan's personal developer portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${outfit.variable} ${absans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
