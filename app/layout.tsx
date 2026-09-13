import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Copywrite",
  description:
    "Creator authenticity registry — provable, revocable content claims gated by World ID Selfie Check.",
  icons: {
    icon: "/copywrite_logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        <Providers>
          <AppHeader />
          <main className="relative z-10 flex flex-1 flex-col">{children}</main>
          <AppFooter />
        </Providers>
      </body>
    </html>
  );
}
