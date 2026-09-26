import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

import AgentationWrapper from "./_components/AgentationWrapper";

export const metadata: Metadata = {
  title: "SkillBuildz — Event Registration & Submission Platform",
  description: "Register for events and submit your projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmSans.variable} ${ibmMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
        {children}
        <AgentationWrapper />
      </body>
    </html>
  );
}
