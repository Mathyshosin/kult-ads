"use client";
import { useState, useRef, useEffect } from "react";
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
  const isAdmin = currentUser?.email === "mathys.hosin@gmail.com";
  const profileRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-5">
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="group hover:opacity-90 transition-opacity">
            <KultLogoFull />
          </Link>

          {/* Navigation — simplified to 2 main tabs */}
          <div className="flex items-center bg-gray-100/80 rounded-xl p-1 gap-0.5">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? "text-blue-500" : ""}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

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
