"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicNavbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkStyle = (path: string) =>
    `relative px-5 py-2 rounded-full transition-all duration-300 
    ${
      pathname === path
        ? "text-cyan-400"
        : "text-white/80 hover:text-white"
    }`;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl bg-white/5 border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="flex justify-between items-center px-8 sm:px-16 py-4">
        {/* LOGO */}
        <Link href="/">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide 
          bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 
          bg-clip-text text-transparent animate-gradient-x">
            Lexora
          </h1>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex gap-4 items-center">

          {!user ? (
            <>
              <Link href="/login" className={linkStyle("/login")}>
                Login
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link
                href="/signup"
                className="relative px-6 py-2 rounded-full font-semibold text-black
                bg-gradient-to-r from-cyan-400 to-purple-500
                hover:scale-110 transition-all duration-300
                shadow-lg shadow-cyan-500/40 overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition duration-300 blur-xl"></span>
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 text-black font-semibold hover:scale-110 transition-all shadow-lg shadow-purple-500/40"
            >
              Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}