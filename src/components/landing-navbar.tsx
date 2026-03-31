"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdlyLogoFull } from "@/components/adly-logo";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#comment-ca-marche", label: "Comment ça marche" },
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#tarifs", label: "Tarifs" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Floating bar container */}
      <div className="mx-auto max-w-7xl px-6">
        <div className={`flex items-center justify-between transition-all duration-300 ease-out h-16 ${
          scrolled
            ? "bg-white/80 backdrop-blur-2xl shadow-lg shadow-black/[0.04] rounded-2xl px-5 -mx-1"
            : "bg-transparent"
        }`}>
          {/* Logo */}
          <Link href="/" aria-label="Accueil" className="relative z-10 flex-shrink-0">
            <AdlyLogoFull iconSize={scrolled ? "w-7 h-7" : "w-9 h-9"} textSize={scrolled ? "text-[15px]" : "text-[17px]"} />
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center flex-1 justify-center min-w-0">
            <div className="flex items-center gap-0.5">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`group relative font-medium rounded-lg text-gray-500 hover:text-gray-900 transition-all duration-200 whitespace-nowrap ${
                    scrolled ? "text-[12px] px-3 py-1.5" : "text-[13px] px-4 py-1.5"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute inset-0 rounded-lg bg-gray-100/0 group-hover:bg-gray-100/80 transition-all duration-200 scale-90 group-hover:scale-100" />
                </a>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 relative z-10 flex-shrink-0">
            <Link
              href="/login"
              className={`hidden text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-all ${
                scrolled ? "lg:inline-flex" : "sm:inline-flex"
              }`}
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="relative text-[13px] font-semibold text-white px-5 py-2 rounded-xl overflow-hidden group transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <span className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Commencer</span>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100/80 transition-colors"
              aria-label="Menu"
            >
              <div className="w-4 h-3 flex flex-col justify-between">
                <span className={`block h-[1.5px] bg-gray-700 rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "rotate-45 translate-y-[5.25px]" : ""
                }`} />
                <span className={`block h-[1.5px] bg-gray-700 rounded-full transition-all duration-200 ${
                  mobileOpen ? "opacity-0 scale-x-0" : ""
                }`} />
                <span className={`block h-[1.5px] bg-gray-700 rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "-rotate-45 -translate-y-[5.25px]" : ""
                }`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <div className={`md:hidden transition-all duration-300 ease-out ${
        mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <div className="mx-4 mt-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/[0.08] border border-white/60 p-3 space-y-0.5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 px-4 py-3 rounded-xl transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-gray-100 my-2" />
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 px-4 py-3 rounded-xl transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-semibold text-center text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-3 rounded-xl"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}
