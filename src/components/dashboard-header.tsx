"use client";
import { useState, useRef, useEffect, useLayoutEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Zap, Images, Building2, Settings, ChevronDown } from "lucide-react";
import { KultLogoFull } from "./kult-logo";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

export default function DashboardHeader() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [showProfile, setShowProfile] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const isAdmin = currentUser?.email === "mathys.hosin@gmail.com";
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch credits
  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/user/subscription")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCredits(data.creditsRemaining); })
      .catch(() => {});
  }, [currentUser]);

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    router.push("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const tabs = [
    { href: "/dashboard/generate", label: "Créer", icon: Zap },
    { href: "/dashboard/ads", label: "Mes Ads", icon: Images },
  ];

  const [isPending, startTransition] = useTransition();
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const realActiveIndex = tabs.findIndex((t) => pathname.startsWith(t.href));
  // Use clicked index immediately for pill position, fall back to real active
  const activeIndex = clickedIndex !== null ? clickedIndex : realActiveIndex;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  // Reset clickedIndex when pathname catches up
  useEffect(() => {
    setClickedIndex(null);
  }, [pathname]);

  // Measure synchronously before paint to avoid flash
  const safeLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  safeLayoutEffect(() => {
    const measure = () => {
      const idx = activeIndex >= 0 ? activeIndex : 0;
      const el = tabRefs.current[idx];
      const container = containerRef.current;
      if (el && container) {
        const cr = container.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        setPill({ left: er.left - cr.left, width: er.width });
      }
    };
    measure();
    // Also re-measure on resize
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      {/* Progress bar during page transition */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 animate-[progress_1.5s_ease-in-out_infinite]"
               style={{ width: "40%", animation: "progress 1.5s ease-in-out infinite" }} />
          <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-5">
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard/generate" className="group hover:opacity-90 transition-opacity">
            <KultLogoFull />
          </Link>

          {/* Navigation tabs with sliding pill */}
          <div ref={containerRef} className="relative flex items-center bg-gray-100/80 rounded-xl p-1 gap-0.5">
            {/* Animated sliding pill */}
            <div
              className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm will-change-transform"
              style={{
                transform: `translateX(${pill.left}px)`,
                width: pill.width > 0 ? `${pill.width}px` : undefined,
                transition: "transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1), width 250ms cubic-bezier(0.25, 0.1, 0.25, 1)",
              }}
            />
            {tabs.map((tab, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={tab.href}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  onClick={() => {
                    if (pathname.startsWith(tab.href)) return;
                    setClickedIndex(i);
                    startTransition(() => {
                      router.push(tab.href);
                    });
                  }}
                  className={`relative z-10 flex items-center gap-2 px-5 py-2 text-[13px] font-medium rounded-lg transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-blue-500" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Credits badge */}
          {credits !== null && !isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-lg px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-bold text-violet-700">{credits}</span>
              <span className="text-[10px] text-violet-400">crédits</span>
            </div>
          )}

          {/* User profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center ring-2 ring-white">
                <span className="text-xs font-bold text-blue-600">
                  {(currentUser?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-600">
                {currentUser?.name || currentUser?.email?.split("@")[0]}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.name || "Mon compte"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                </div>
                <Link
                  href="/dashboard/brand"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Ma Marque
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/templates"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Catalogue
                  </Link>
                )}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
