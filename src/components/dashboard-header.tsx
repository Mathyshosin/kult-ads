"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Building2, LogOut, Zap, Images, BookOpen } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

export default function DashboardHeader() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const tabs = [
    { href: "/dashboard/brand", label: "Marque", icon: Building2 },
    { href: "/dashboard/generate", label: "Créer", icon: Zap },
    { href: "/dashboard/ads", label: "Mes Ads", icon: Images },
    { href: "/dashboard/templates", label: "Catalogue", icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-5">
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">
              Kult<span className="text-blue-500">ads</span>
            </span>
          </Link>

          {/* Navigation pills */}
          <div className="flex items-center bg-gray-100/80 rounded-xl p-1 gap-0.5">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? "text-blue-500" : ""}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center ring-2 ring-white">
                  <span className="text-xs font-bold text-blue-600">
                    {(currentUser.name || currentUser.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {currentUser.name || currentUser.email?.split("@")[0]}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
