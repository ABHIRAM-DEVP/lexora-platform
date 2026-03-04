"use client";

import { ReactNode } from "react";
import PublicNavbar from "@/components/Navbar";
import AuroraBackground from "@/components/AuroraBackground";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-[#0b0f1a]">

      {/* Aurora Motion */}
      <AuroraBackground />

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Glow Radial */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[200px] rounded-full"></div>

      <PublicNavbar />

      <main className="relative pt-32 px-6 sm:px-16 z-10">
        {children}
      </main>
    </div>
  );
}