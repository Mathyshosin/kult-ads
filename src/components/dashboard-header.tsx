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
    <nav className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 btn-gradient rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">
              Kult<span className="text-gradient">ads</span>
            </span>
          </Link>

          {/* Tabs */}
          <div className="toggle-pill flex items-center gap-0.5">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-200 ${
                    isActive
                      ? "toggle-pill-active"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center ring-1 ring-border/60">
                  <span className="text-xs font-semibold text-primary">
                    {(currentUser.name || currentUser.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted">
                  {currentUser.name || currentUser.email}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
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
