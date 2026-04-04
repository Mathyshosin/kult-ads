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
    { href: "/login", label: "Connexion" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className={`transition-all duration-500 ease-out ${
        scrolled ? "mx-4 sm:mx-8 mt-3" : "mx-0 mt-0"
      }`}>
        <div className={`flex items-center justify-between transition-all duration-500 ease-out px-6 sm:px-8 ${
          scrolled
            ? "bg-white/90 backdrop-blur-2xl shadow-lg shadow-black/[0.06] rounded-full h-12"
            : "bg-white border-b border-gray-100 rounded-none h-14"
        }`}>
          {/* Left links — desktop */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {links.map((link) => (
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100/60 transition-all duration-200 whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100/60 transition-all duration-200 whitespace-nowrap"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Center logo */}
          <Link href="/" aria-label="Accueil" className="absolute left-1/2 -translate-x-1/2">
            <LoopadLogoFull iconSize="w-8 h-8" textSize="text-[16px]" />
          </Link>

          {/* Right CTA */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-5 py-2 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/20"
            >
              Commencer
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <Link
              href="/signup"
              className="text-[12px] font-semibold text-white bg-violet-600 px-4 py-1.5 rounded-full"
            >
              Commencer
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100/80 transition-colors"
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
        <div className="mx-4 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/[0.08] border border-gray-100 p-3 space-y-0.5">
          {links.map((link) => (
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 px-4 py-3 rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 px-4 py-3 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            )
          ))}
          <div className="border-t border-gray-100 my-2" />
          <Link
            href="/signup"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-semibold text-center text-white bg-violet-600 px-4 py-3 rounded-xl"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}
