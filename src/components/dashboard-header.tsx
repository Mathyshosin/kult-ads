"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Building2, LogOut, Wand2, LayoutGrid, Layout } from "lucide-react";
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
    { href: "/dashboard/brand", label: "Ma Marque", icon: Building2 },
    { href: "/dashboard/generate", label: "Générateur", icon: Wand2 },
    { href: "/dashboard/ads", label: "Mes Ads", icon: LayoutGrid },
    { href: "/dashboard/templates", label: "Templates", icon: Layout },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-primary rounded-[8px] flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-foreground tracking-tight">
              Kult<span className="text-gradient">ads</span>
            </span>
          </Link>

          {/* iOS Segmented Control */}
          <div className="toggle-pill flex items-center gap-0.5">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-[6px] text-[13px] font-medium rounded-[8px] transition-all duration-200 ${
                    isActive
                      ? "toggle-pill-active"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {(currentUser.name || currentUser.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[13px] font-medium text-muted">
                  {currentUser.name || currentUser.email}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-black/5 transition-colors"
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
