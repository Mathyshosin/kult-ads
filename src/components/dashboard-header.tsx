"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Building2, LogOut } from "lucide-react";
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
    { href: "/dashboard/generate", label: "Générateur", icon: Sparkles },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Kult-ads</span>
          </Link>

          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <span className="text-xs text-muted hidden sm:block">
                {currentUser.name || currentUser.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
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
