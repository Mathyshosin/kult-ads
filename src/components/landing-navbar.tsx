"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoopadLogoFull } from "@/components/adly-logo";

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
    { href: "#tarifs", label: "Tarifs" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3">
      <div className={`max-w-6xl mx-auto bg-gray-900/60 backdrop-blur-xl rounded-full border border-white/10 transition-all duration-300 ${
        scrolled ? "bg-gray-900/80 shadow-lg shadow-black/20" : ""
      }`}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-12">
          {/* Logo — left */}
          <Link href="/" aria-label="Accueil" className="flex-shrink-0">
            <LoopadLogoFull iconSize="w-7 h-7" textSize="text-[15px]" dark />
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-white/70 hover:text-white px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200 whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right — Connexion + CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[13px] font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="text-[12px] sm:text-[13px] font-semibold text-gray-900 bg-white hover:bg-gray-100 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full transition-all duration-200"
            >
              Commencer
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ml-1"
              aria-label="Menu"
            >
              <div className="w-3.5 h-2.5 flex flex-col justify-between">
                <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "rotate-45 translate-y-[4.5px]" : ""
                }`} />
                <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-200 ${
                  mobileOpen ? "opacity-0 scale-x-0" : ""
                }`} />
                <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "-rotate-45 -translate-y-[4.5px]" : ""
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
        <div className="max-w-6xl mx-auto mt-2 bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-gray-100 p-3 space-y-0.5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-3 rounded-xl transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-gray-100 my-2" />
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-3 rounded-xl transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-semibold text-center text-white bg-gray-900 px-4 py-3 rounded-xl"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}
