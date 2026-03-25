"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { KultLogoFull } from "@/components/kult-logo";

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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100/80"
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" aria-label="Accueil" className="relative z-10">
            <KultLogoFull />
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center">
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 transition-all duration-300 ${
              scrolled ? "bg-gray-50/80" : "bg-white/10 backdrop-blur-sm"
            }`}>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
                    scrolled
                      ? "text-gray-600 hover:text-gray-900 hover:bg-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-white/60"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 relative z-10">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[13px] font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-2 rounded-full hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Commencer
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${
        mobileOpen ? "max-h-64 border-b border-gray-100" : "max-h-0"
      }`}>
        <div className="bg-white/95 backdrop-blur-xl px-6 py-4 space-y-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors sm:hidden"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </nav>
  );
}
