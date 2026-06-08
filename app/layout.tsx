import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./socialhub.css";
import "./lives.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--loaded-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--loaded-mono",
});

export const metadata: Metadata = {
  title: "SocialHub · Gocase",
  description: "Calendário editorial de redes sociais Gocase",
  icons: { icon: '/icone_web.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body style={{ fontFamily: "var(--loaded-sans, var(--font-sans))" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
