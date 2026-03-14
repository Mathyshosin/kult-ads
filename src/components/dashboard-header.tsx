"use client";

import Link from "next/link";
import { Sparkles, LogOut } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

export default function DashboardHeader() {
  const reset = useWizardStore((s) => s.reset);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">Kult-ads</span>
        </Link>
        <div className="flex items-center gap-4">
          {currentUser && (
            <span className="text-xs text-muted hidden sm:block">
              {currentUser.name || currentUser.email}
            </span>
          )}
          <button
            onClick={() => {
              reset();
              router.push("/dashboard/analyze");
            }}
            className="text-xs text-primary hover:text-primary-dark font-medium px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            Nouvelle campagne
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
